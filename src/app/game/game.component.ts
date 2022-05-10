import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import * as ObsWebSocket from 'obs-websocket-js';
import { Subscription, take, timer } from 'rxjs';
import { environment } from 'src/environments/environment';

interface Card {
  name: string;
  url: string;
  votes: number;
  id?: number;
  disabled?: boolean;
}

enum GameState {
  GameOver = 'game-over',
  CountdownSelectChoice = 'countdown-select-choice',
  RoundCooldown = 'round-cooldown',
  GameVictory = 'game-victory',
}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements OnInit, OnDestroy {
  allCardsUnique: Card[] = [
    // { name: 'GCP', url: 'gcp.png', votes: 0 },
    { name: 'Angular', url: 'angular1.png', votes: 0 },
    // { name: 'Azure', url: 'azure.png', votes: 0 },
    // { name: 'Firebase', url: 'firebase.svg', votes: 0 },
    { name: 'React', url: 'react.png', votes: 0 },
    { name: 'Vue', url: 'vue1.png', votes: 0 },
    // { name: 'Docker', url: 'docker.png', votes: 0 },
    { name: 'Kubernetes', url: 'kubernetes.png', votes: 0 },
    // { name: 'TypeScript', url: 'ts.png', votes: 0 },
    // { name: 'Git', url: 'git.png', votes: 0 },
    // { name: 'Computas', url: 'computas.png', votes: 0 },
  ];

  // with duplicates
  allCardsTotal: Card[] = [];

  cards: Card[] = [];
  selectedCards: Card[] = [];
  victory = false;

  // showIntro = true;
  // showOutro = false;

  obsConnection: ObsWebSocket = new ObsWebSocket();
  obsIsConnected = false;
  gameTime = 0;
  gameScore = 0;
  gameTurns = 0;
  gameText = '';
  gameState: GameState = GameState.GameOver;
  subscriptions = new Subscription();

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.allCardsTotal = this.shuffleCards(
      [...this.allCardsUnique].concat([...this.allCardsUnique])
    );

    // use array index as id
    this.allCardsTotal = this.allCardsTotal.map((current, index) => {
      return {
        ...current,
        id: index,
        disabled: false,
      };
    });

    this.cards = [...this.allCardsTotal];

    this.preLoadImages();
    this.connectToObs();
    this.setGameState(GameState.GameOver);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  loadVotes() {
    //
    this.http
      .get('https://memo-game-java.azurewebsites.net/api/getcardvotes')
      .subscribe((data: any) => {
        console.log(data);
        // set all to 0 first
        this.cards = this.cards.map((current) => {
          return {
            ...current,
            votes: 0,
          };
        });
        data.forEach((current: { cardId: string; count: number }) => {
          this.cards[+current.cardId].votes = current.count;
        });
      });
  }

  updateGameStateInDb() {
    this.http
      .put('https://memo-game-java.azurewebsites.net/api/putgamestate ', {
        state: this.gameState,
      })
      .subscribe(() => {
        console.log('game state updated in DB');
      });
  }

  updateDbGameData() {
    this.http
      .put('https://memo-game-java.azurewebsites.net/api/putgamestats', {
        score: this.gameScore,
        time: this.gameTime,
        turns: this.gameTurns,
        totalCards: this.allCardsTotal.length,
        activeCardIndexes: this.cards
          .filter((current) => !current.disabled)
          .map((current) => current.id),
      })
      .subscribe(() => {
        console.log('updated!');
      });
  }

  clearVotes() {
    this.http
      .delete(
        'https://twitch-memo-function-1.azurewebsites.net/api/ClearVotes?code=7nRc3G6GSxPOP80nv7d9K9prcdO72Uy4VC8xsgup2BoOAzFuUrDsEw=='
      )
      .subscribe(() => {
        console.log('votes cleared in DB');
        this.cards = this.cards.map((current) => {
          return {
            ...current,
            votes: 0,
          };
        });
      });
  }

  setGameState(state: GameState) {
    this.gameState = state;
    this.updateGameStateInDb();
  }

  startRound() {
    // TODO
    timer(0, 1000)
      .pipe(take(17))
      .subscribe((tick) => {
        console.log(tick);
        if (tick === 0) {
          this.updateDbGameData();
          this.setGameState(GameState.CountdownSelectChoice);
          this.gameTurns++;
        }
        // if (tick < 10) {
        //   // TODO vote fase
        // }
        //DEBUG
        if (tick === 8) {
          // this.simulateVotes();
        }
        if (tick <= 10) {
          this.loadVotes();
        }
        if (tick === 10) {
          this.setGameState(GameState.RoundCooldown);
          const mostPopularCard = this.getCardWithMostVotes();
          if (mostPopularCard) {
            this.clickedCard(mostPopularCard);
          }
        }
        if (tick === 11) {
          // TODO cooldown
        }
        if (tick === 16) {
          // New round
          setTimeout(() => {
            this.clearVotes();
            if (this.cards.some((current) => !current.disabled)) {
              this.startRound();
            } else {
              this.setGameState(GameState.GameVictory);
              this.victory = true;
              this.endGame();
            }
          }, 1000);
        }
      });
  }

  startGame() {
    this.subscriptions.add(
      timer(0, 1000).subscribe(() => {
        this.gameLoopTick();
      })
    );
    this.startRound();
  }

  endGame() {
    // TODO
    this.subscriptions.unsubscribe();
    // this.setGameState(GameState.GameOver);
  }

  simulateVotes() {
    this.cards = this.cards.map((current) => {
      return {
        ...current,
        votes: Math.floor(Math.random() * 5),
      };
    });
  }

  getCardWithMostVotes() {
    const maxVotes = Math.max(...this.cards.map((current) => current.votes));
    const mostPopular = this.cards.filter(
      (current) => current.votes === maxVotes
    );
    return mostPopular[Math.floor(Math.random() * mostPopular.length)];
  }

  gameLoopTick() {
    this.gameTime++;
    this.loadGameText();
    if (this.obsIsConnected) {
      this.updateObsTexts();
    }
  }

  async connectToObs() {
    this.obsConnection = new ObsWebSocket();
    await this.obsConnection.connect({
      address: 'localhost:4444',
      password: environment.obsPassword,
    });
    this.obsIsConnected = true;
  }

  async updateObsTexts() {
    await this.obsConnection.send('SetTextGDIPlusProperties', {
      source: 'Turns',
      text: 'Turn: ' + this.gameTurns,
    });
    await this.obsConnection.send('SetTextGDIPlusProperties', {
      source: 'Score',
      text: 'Score: ' + this.gameScore,
    });
    await this.obsConnection.send('SetTextGDIPlusProperties', {
      source: 'Time',
      text: 'Time: ' + this.gameTime + ' sec',
    });
    await this.obsConnection.send('SetTextGDIPlusProperties', {
      source: 'Text',
      text: this.gameText.slice(0, 20),
    });
    // console.log('text set');
  }

  loadGameText() {
    this.http
      .get(
        'https://memo-game-twitch-java-test6.azurewebsites.net/api/getMesseges'
      )
      .subscribe((response: any) => {
        this.gameText = response.text.toString();
        this.updateObsTexts();
      });
  }

  testAzureFunction() {
    this.http
      .get(
        'https://twitch-memo-function-1.azurewebsites.net/api/HttpTrigger1?code=2pz1mQUTRouxOYbXsyU289xfVJ8OrJf8gBAj6-Njb5fHAzFuTOjLYw=='
      )
      .subscribe((data) => {
        console.log('response:', data);
      });
  }
  gotoNextTask() {
    console.log('done!');
  }

  // todo pipe
  cardVisible(id: Card['id']) {
    return this.selectedCards.some((current) => current.id === id);
  }

  //card with most votes (or random among most)
  clickedCard(card: Card) {
    if (card.disabled) {
      return;
    }
    if (this.selectedCards.length >= 2) {
      this.selectedCards = [];
    }

    if (this.selectedCards.length === 0) {
      this.selectedCards.push({ ...card });
    } else if (
      this.selectedCards.length === 1 &&
      this.selectedCards[0].id !== card.id
    ) {
      this.selectedCards.push({ ...card });
      if (this.selectedCardsSame()) {
        setTimeout(() => {
          this.gameScore++;
          this.disableCardByName(card.name);
        }, 1500);
      }
    }
    //TODO send selection to backend
  }

  private disableCardByName(name: Card['name']) {
    this.cards = this.cards.map((currentCard) => {
      if (currentCard.name === name) {
        currentCard.disabled = true;
      }
      return currentCard;
    });

    // if all disabled
    if (!this.cards.some((currentCard) => !currentCard.disabled)) {
      // this.showOutro = true;
      //TODO
      console.log('123');
    }
  }

  private selectedCardsSame(): boolean {
    if (this.selectedCards.length !== 2) {
      return false;
    }
    return this.selectedCards[0].name === this.selectedCards[1].name;
  }

  private preLoadImages() {
    const paths = this.allCardsUnique.map(
      (current) => 'assets/memory/' + current.url
    );

    const images = new Array();

    paths.forEach((currentImgPath) => {
      const image = new Image();
      image.src = currentImgPath;
      images.push(image);
    });
  }

  // from stackoverflow
  private shuffleCards(cards: Card[]) {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  }
}
