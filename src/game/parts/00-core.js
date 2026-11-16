

(function () {
'use strict';

/* ---------- constants ---------- */
let COLS = 320, W = COLS * 8;
var customBuild = null; let ROWS = 96, H = ROWS * 8; const T = 8, DT = 1 / 60, PW = 8, PH = 8, RES = 1, VW = 320, VH = 180;
const NORMAL = 0, CLIMB = 1, DASH = 2, STATE_NAMES = ['NORMAL', 'CLIMB', 'DASH'];
const $ = id => document.getElementById(id);
const cv = $('game');
let ctx = cv.getContext('2d', { willReadFrequently: true });
const mainCtx = ctx;
cv.width = VW; cv.height = VH;
ctx.imageSmoothingEnabled = false;
const cs = getComputedStyle(document.documentElement);
const tok = n => cs.getPropertyValue(n).trim();
const C = {
  sky1: tok('--sky1'), sky2: tok('--sky2'), mtn1: tok('--mtn1'), mtn2: tok('--mtn2'),
  solid: tok('--solid'), top: tok('--solid-top'), hazard: tok('--hazard'), crystal: tok('--crystal'), spring: tok('--spring'), grass: tok('--grass'), gem: tok('--gem'),
  ready: tok('--accent'), spent: tok('--cool'), ink: tok('--bg'), star: tok('--fg')
};

