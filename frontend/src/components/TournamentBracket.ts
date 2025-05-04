interface TournamentMatch {
    id: number;
    tournament_id: number;
    player1_id: number;
    player2_id: number;
    player1_score: number;
    player2_score: number;
    winner_id: number;
    game_id: number;
    round: number;
    match_order: number;
  }

export class TournamentBracket 
{
    private matches: TournamentMatch[];
    private rounds: Record<number, TournamentMatch[]>;
    private participants;
  
    constructor(matches: TournamentMatch[], participants) 
    {
      this.matches = matches;
      this.rounds = this.groupByRounds();
      this.participants = participants;
    }

    private getPlayerUsername(player_id: number)
    {
        for(const participant of this.participants)
        {
            if (participant.id === player_id)
            {
              if (participant.display_name)
                return (`${participant.username} (${participant.display_name})`);
              else
                return participant.username;
            }
        }
        return '-';
    }
  
    private groupByRounds(): Record<number, TournamentMatch[]> 
    {
      const rounds: Record<number, TournamentMatch[]> = {};
      
      this.matches.forEach(match => {
        if (!rounds[match.round]) {
          rounds[match.round] = [];
        }
        rounds[match.round].push(match);
      });
      

      for (const round in rounds) 
      {
        rounds[round].sort((a, b) => a.match_order - b.match_order);
      }
      
      return rounds;
    }
  
    public renderBracket(container: HTMLElement): void {
      container.innerHTML = '';
      let displayPlay:number = 0; 
      
      const bracketDiv = document.createElement('div');
      bracketDiv.className = 'flex space-x-8 overflow-x-auto p-6';
      
    
      for (const roundNum in this.rounds) {
        const roundDiv = document.createElement('div');
        roundDiv.className = 'flex flex-col space-y-4 min-w-[220px]';
        roundDiv.innerHTML = `<h3 class="text-lg font-bold mb-2 sticky top-0 bg-white py-2">Round ${roundNum}</h3>`;
        
        this.rounds[parseInt(roundNum)].forEach(match => {
          const matchDiv = document.createElement('div');
          matchDiv.className = `border rounded-lg p-3 ${
            match.winner_id > 0 ? 'bg-green-50' : 'bg-yellow-50'
          }`;

          matchDiv.innerHTML = `
            <div class="text-xs text-gray-400 mt-1 text-center">Match #${match.match_order} </div>
            <div class="flex justify-between items-center p-1 ${
              match.winner_id === match.player1_id ? 'font-bold text-green-700' : ''
            }">
            <span>${ this.getPlayerUsername(match.player1_id)}</span>
              ${match.winner_id > 0 ? `<span class="text-gray-500">${match.player1_score || '0'}</span>` : ''}
            </div>
            <div class="border-t my-1"></div>
            <div class="flex justify-between items-center p-1 ${
              match.winner_id === match.player2_id ? 'font-bold text-green-700' : ''
            }">
              <span>${ this.getPlayerUsername(match.player2_id) }</span>
              ${match.winner_id > 0 ? `<span class="text-gray-500">${match.player2_score || '0'}</span>` : ''}
            </div>
            
          `;
          roundDiv.appendChild(matchDiv);
        });
        
        bracketDiv.appendChild(roundDiv);
      }
      
      container.appendChild(bracketDiv);
    }
  
  }