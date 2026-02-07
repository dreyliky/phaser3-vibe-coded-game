import Phaser from 'phaser';
import { config } from './config/config';

const game = new Phaser.Game(config);

(window as any).game = game;
