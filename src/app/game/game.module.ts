import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GameRoutingModule } from './game-routing.module';
import { GameComponent } from './game.component';
import { MatButtonModule } from '@angular/material/button';
import { MatSliderModule } from '@angular/material/slider';

@NgModule({
  declarations: [GameComponent],
  imports: [CommonModule, GameRoutingModule, MatSliderModule, MatButtonModule],
})
export class GameModule {}
