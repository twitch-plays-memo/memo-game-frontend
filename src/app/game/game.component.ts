import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import * as ObsWebSocket from 'obs-websocket-js';
import { environment } from 'src/environments/environment';

interface Card {
  name: string;
  url: string;
  id?: number;
  disabled?: boolean;
}

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements OnInit {
  allCardsUnique: Card[] = [
    { name: 'GCP', url: 'gcp.png' },
    { name: 'Angular', url: 'angular1.png' },
    // { name: 'Azure', url: 'azure.png' },
    { name: 'Firebase', url: 'firebase.svg' },
    { name: 'React', url: 'react.png' },
    // { name: 'Vue', url: 'vue1.png' },
    // { name: 'Docker', url: 'docker.png' },
    { name: 'Kubernetes', url: 'kubernetes.png' },
    // { name: 'TypeScript', url: 'ts.png' },
    // { name: 'Git', url: 'git.png' },
    { name: 'Computas', url: 'computas.png' },
  ];

  // with duplicates
  allCardsTotal: Card[] = [];

  cards: Card[] = [];
  selectedCards: Card[] = [];

  // showIntro = true;
  // showOutro = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    const cards1 = [...this.allCardsUnique];
    const cards2 = [...this.allCardsUnique];
    this.allCardsTotal = this.shuffleCards(cards1.concat(cards2));

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
    // this.connectToObs();
  }

  async connectToObs() {
    const obs = new ObsWebSocket();
    await obs.connect({
      address: 'localhost:4444',
      password: environment.obsPassword,
    });
    const sceneList = await obs.send('GetSceneList');
    console.log('OBS scene list:', sceneList);
    console.log(`${sceneList.scenes.length} Available Scenes!`);

    await obs.send('SetCurrentScene', {
      'scene-name': 'Scene 2',
    });
    console.log('scene 1 set');
    await obs.send('SetTextGDIPlusProperties', {
      source: 'MyText',
      text: 'From Angular',
    });
    console.log('text set');
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
          this.disableCardByName(card.name);
        }, 200);
      }
    }
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
