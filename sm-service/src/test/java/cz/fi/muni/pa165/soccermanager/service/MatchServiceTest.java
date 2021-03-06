package cz.fi.muni.pa165.soccermanager.service;

import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.testng.Assert;
import org.testng.annotations.BeforeClass;
import org.testng.annotations.BeforeMethod;
import org.testng.annotations.Test;

import cz.fi.muni.pa165.soccermanager.api.exceptions.SoccerManagerServiceException;
import cz.fi.muni.pa165.soccermanager.dao.MatchDAO;
import cz.fi.muni.pa165.soccermanager.data.Match;
import cz.fi.muni.pa165.soccermanager.data.SoccerPlayer;
import cz.fi.muni.pa165.soccermanager.data.Team;
/**
 * @author Dominik Pilar
 *
 */
public class MatchServiceTest {


    private MatchService matchService;

    @Mock
    private MatchDAO matchDAO;

    private Match match1, match2;
    private Team slovan, senica;
    private SoccerPlayer player1, player2;

    @BeforeClass
    public void init() {
        MockitoAnnotations.initMocks(this);
        matchService = new MatchServiceImpl(matchDAO);
    }
    @BeforeMethod
    public void setup() {
        senica = new Team();
        senica.setId(1L);
        senica.setBudget(BigDecimal.valueOf(200000));
        senica.setChampionshipName("Fortuna liga");
        senica.setClubName("Senica");
        senica.setCountry("Slovakia");
        senica.setPlayers(new ArrayList<>());


        slovan = new Team();
        slovan.setId(2L);
        slovan.setBudget(BigDecimal.valueOf(500000));
        slovan.setChampionshipName("Fortuna liga");
        slovan.setClubName("Slovan");
        slovan.setCountry("Slovakia");
        slovan.setPlayers(new ArrayList<>());

        player1 = new SoccerPlayer();
        player1.setId(1L);
        player1.setRating(50);
        player1.setTeam(slovan);
        player2 = new SoccerPlayer();
        player2.setId(2L);
        player2.setRating(55);
        player2.setTeam(senica);

        slovan.addPlayer(player1);
        senica.addPlayer(player2);

        match1 = new Match();
        match1.setId(1L);
        match1.setAwayTeam(slovan);
        match1.setHomeTeam(senica);
        match1.setDate(Instant.now().minus(5, ChronoUnit.DAYS));
        match1.setAwayTeamGoals(1);
        match1.setHomeTeamGoals(3);

        match2 = new Match();
        match2.setId(2L);
        match2.setAwayTeam(senica);
        match2.setHomeTeam(slovan);
        match2.setDate(Instant.now().plus(5, ChronoUnit.DAYS));
    }

    @Test
    public void createMatch() {
        matchService.create(match1);
        then(matchDAO).should().save(match1);
    }

    @Test
    public void remove() {
        given(matchDAO.findById(match1.getId())).willReturn(match1);
        matchService.remove(match1);
        then(matchDAO).should().delete(match1);
    }

    @Test
    public void findById() {
        given(matchDAO.findById(match1.getId())).willReturn(match1);
        Match m = matchService.findById(match1.getId());
        Assert.assertEquals(match1, m);
    }

    @Test(expectedExceptions = SoccerManagerServiceException.class, expectedExceptionsMessageRegExp = "No match found with an ID: " + 1L )
    public void findByIdReturnNull() {
        given(matchDAO.findById(1L)).willReturn(null);
        matchService.findById(1L);
    }

    @Test
    public void findAll() {

        given(matchDAO.findAll()).willReturn(Arrays.asList(match1,match2));
        List<Match> matches = matchService.findAll();

        Assert.assertEquals(2, matches.size());
        Assert.assertTrue(matches.contains(match1));
        Assert.assertTrue(matches.contains(match2));
    }

    @Test
    public void findByTeam() {
        given(matchDAO.findAll()).willReturn(Arrays.asList(match1,match2));
        List<Match> matches = matchService.findByTeam(senica);

        Assert.assertEquals(2, matches.size());
        Assert.assertTrue(matches.contains(match1));
        Assert.assertTrue(matches.contains(match2));
    }
    @Test
    public void findByUnknownTeam() {
        Team t = new Team();
        given(matchDAO.findAll()).willReturn(Arrays.asList(match1,match2));
        List<Match> matches = matchService.findByTeam(t);

        Assert.assertEquals(0, matches.size());
    }

    @Test
    public void findAwaitingMatches() {
        match2.setDate(Instant.now().minus(1, ChronoUnit.HOURS));
        given(matchDAO.findAll()).willReturn(Arrays.asList(match2, match1));
        List<Match> matches = matchService.findNotSimulatedMatches();

        System.out.println("match1 date: "+match1.getDate());
        System.out.println("match2 date: "+match2.getDate());
        System.out.println("current date: "+Instant.now());

        Assert.assertEquals(1, matches.size());
        Assert.assertTrue(matches.contains(match2));

    }

    @Test
    public void simulateMatch() {
        match2.setDate(Instant.now());
        matchService.simulateMatch(match2);

        Assert.assertNotNull(match2.getHomeTeamGoals());
        Assert.assertNotNull(match2.getAwayTeamGoals());

    }

    @Test(expectedExceptions = SoccerManagerServiceException.class, expectedExceptionsMessageRegExp = "A match with an ID \"" + "[0-9]+" + "\" has already been simulated!")
    public void alreadySimulatedMatch() {
        matchService.simulateMatch(match1);
    }

    @Test(expectedExceptions = SoccerManagerServiceException.class, expectedExceptionsMessageRegExp = "A match with an ID \"" + "[0-9]+" + "\" has not taken place yet!")
    public void simulateMatchInFuture() {
        matchService.simulateMatch(match2);
    }

    @Test
    public void getWinnerOfMatch() {
        Team winner = matchService.getWinner(match1);

        Assert.assertEquals(senica, winner);
    }

    @Test(expectedExceptions = SoccerManagerServiceException.class, expectedExceptionsMessageRegExp = "A match with an ID \"" + "[0-9]+" + "\" has not been simulated yet!")
    public void getWinnerOfNonSimulatedMatch() {
        matchService.getWinner(match2);
    }

    @Test
    public void getVictoriesOfTeam() {
        given(matchDAO.findAll()).willReturn(Arrays.asList(match1, match2));
        int victories  = matchService.getVictoriesOfTeam(senica);

        Assert.assertTrue(victories == 1);
    }


}
