package cz.fi.muni.pa165.soccermanager.service.facade;

import cz.fi.muni.pa165.soccermanager.api.dto.PlayerChangeDTO;
import cz.fi.muni.pa165.soccermanager.api.dto.PlayerCreateDTO;
import cz.fi.muni.pa165.soccermanager.api.dto.PlayerDTO;
import cz.fi.muni.pa165.soccermanager.api.dto.PlayerFreeDTO;
import cz.fi.muni.pa165.soccermanager.api.facade.PlayerFacade;
import cz.fi.muni.pa165.soccermanager.data.SoccerPlayer;
import cz.fi.muni.pa165.soccermanager.service.BeanMapping;
import cz.fi.muni.pa165.soccermanager.service.PlayerService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.inject.Inject;
import java.util.List;

/**
 * Implementation of facade layer for Player
 *
 * @author Michal Mazourek
 */

@Service
@Transactional
public class PlayerFacadeImpl implements PlayerFacade {
    
    private PlayerService playerService;
    private BeanMapping beanMapping;
    
    @Inject
    public PlayerFacadeImpl(BeanMapping beanMapping, PlayerService playerService) {
        this.beanMapping = beanMapping;
        this.playerService = playerService;
    }
    
    @Override
    public void createPlayer(PlayerCreateDTO player) {
        playerService.createPlayer(beanMapping.mapTo(player, SoccerPlayer.class));
    }

    @Override
    public void removePlayer(Long playerId) {
        playerService.removePlayer(playerService.findPlayerById(playerId));
    }

    @Override
    public PlayerDTO findPlayerById(Long id) {
        return beanMapping.mapTo(playerService.findPlayerById(id), PlayerDTO.class);
    }

    @Override
    public List<PlayerDTO> findAllPlayers() {
        return beanMapping.mapTo(playerService.findAllPlayers(), PlayerDTO.class);
    }

    @Override
    public List<PlayerFreeDTO> findFreePlayers() {
        return beanMapping.mapTo(playerService.findFreePlayers(), PlayerFreeDTO.class);
    }

    @Override
    public void changePlayerAttributes(PlayerChangeDTO player) {
        playerService.changePlayerAttributes(playerService.findPlayerById(player.getId()), 
                player.getPosition(), player.getFooted(), player.getRating());
    }
}
