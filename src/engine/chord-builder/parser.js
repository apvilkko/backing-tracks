import Lexer from 'lex/lexer';
import contains from 'lodash/fp/contains';
import each from 'lodash/fp/each';
import filter from 'lodash/fp/filter';
import find from 'lodash/fp/find';
import flow from 'lodash/fp/flow';
import map from 'lodash/fp/map';
import remove from 'lodash/fp/remove';
import sortBy from 'lodash/fp/sortBy';

const doPush = (arr, value) => {
  if (value) {
    arr.push(value);
  }
};

const convertAccidental = input =>
  (!input ? input : input.replace('b', '♭').replace('#', '♯'));

const toAccidental = value =>
  (!value ? value : value.toLowerCase().replace('♭', 'b').replace('♯', '#'));

class ChordParser {
  constructor() {
    this.resetModel();
    this.setupLexer();
  }
  setupLexer() {
    const ACCS = '#|♯|b|♭';
    const ROOT = new RegExp(`^[a-h](${ACCS})?`, 'i');
    const QUALITY = /(\+|-|maj|min|m|aug|dom|dim|sus|alt)/i;
    const INTERVAL = /[1-9]{1,2}/;
    const MODS = `${ACCS}|\\+|\\-`;
    const EXTRA = new RegExp(
      `(?!(^))(((add(${MODS})?)|sus|omit|no|${MODS})[1-9]{1,2})+`, 'i');
    const BASS = new RegExp(`/[a-h](${ACCS})?`, 'i');

    this.lexer = new Lexer(char => {
      throw new Error(char);
    });
    this.lexer
    .addRule(ROOT, value => {
      this.model.root = value[0].toUpperCase();
      const hasAccidental = value.length > 1;
      this.model.rootModifier = hasAccidental ? toAccidental(value[1]) : null;
    })
    .addRule(QUALITY, value => {
      let quality = value;
      if (value === 'M') {
        quality = 'maj';
      } else if (value.toLowerCase() === 'dom') {
        quality = null;
      } else if (value.toLowerCase() === '°') {
        quality = 'dim';
      } else if (value.toLowerCase() === 'min' || value === '-') {
        quality = 'm';
      } else if (value === '+') {
        quality = 'aug';
      }
      // TODO handle half dim (ø) as m7b5
      this.model.quality = quality ? quality.toLowerCase() : quality;
    })
    .addRule(INTERVAL, value => {
      this.model.interval = parseInt(value, 10);
      if (this.model.interval === 8 ||
          this.model.interval === 1) {
        this.model.interval = null;
      }
    })
    .addRule(EXTRA, value => {
      this.model.extra = value;
    })
    .addRule(BASS, value => {
      this.model.bass = value[1].toUpperCase();
      const hasAccidental = value.length > 2;
      this.model.bassModifier = hasAccidental ? toAccidental(value[2]) : null;
    });
  }

  resetModel() {
    this.model = {};
  }

  getModel() {
    return this.model;
  }

  parse(value) {
    this.resetModel();
    this.error = null;
    if (!value) {
      this.error = new Error('empty');
      return false;
    }
    try {
      this.lexer.setInput(value).lex();
    } catch (e) {
      this.error = e;
      return false;
    }
    if (this.model.quality === 'alt') {
      this.model.interval = 7;
    }
    if (this.model.interval === 5 &&
        this.model.quality !== 'dim' &&
        this.model.quality !== 'aug') {
      this.model.quality = 'power';
    }
    if (this.model.root === 'H') {
      this.model.root = 'B';
    }
    if (this.model.bass === 'H') {
      this.model.bass = 'B';
    }
    if (this.model.quality === 'sus' && !this.model.interval) {
      this.model.interval = 4;
    }
    if (this.model.quality === 'sus' && this.model.interval === 7) {
      this.model.susInterval = 4;
    }
    this.processExtras();
    const isSus = item => item.action === 'sus';
    const extraSus = find(isSus)(this.model.extra);
    if (extraSus) {
      this.model.quality = 'sus';
      this.model.susInterval = extraSus.interval;
      this.model.extra = remove(isSus)(this.model.extra);
    }
    return true;
  }

  processExtras() {
    if (this.model.extra) {
      const groups = this.model.extra.split(/([^0-9]+[0-9]+)/);
      this.model.extra = flow(
        filter(item => !!item),
        map(item => {
          const split = item.split(/(\d+)/);
          let accidental = split[0].toLowerCase();
          const interval = parseInt(split[1], 10);
          let action = null;
          if (accidental === 'omit' || accidental === 'no') {
            action = 'omit';
            accidental = null;
          } else if (accidental === 'sus') {
            action = 'sus';
            accidental = null;
          } else if (contains('add')(accidental)) {
            action = 'add';
            accidental = accidental.replace('add', '');
          } else if (accidental === '+') {
            accidental = '#';
          } else if (accidental === '-') {
            accidental = 'b';
          }
          return {
            action: action || 'iadd',
            interval,
            accidental: toAccidental(accidental),
          };
        }),
        sortBy('interval'),
      )(groups);
    }
  }

  toString() {
    if (!this.model.root) {
      return '';
    }
    const isAlt = this.model.quality === 'alt';
    const isPower = this.model.quality === 'power';
    const isSus = this.model.quality === 'sus';
    const ret = [];
    doPush(ret, this.model.root);
    doPush(ret, convertAccidental(this.model.rootModifier));
    doPush(ret, this.model.quality);
    const unnecessaryMaj = this.model.quality === 'maj' && !this.model.interval;
    if (unnecessaryMaj || isAlt || isPower || isSus) {
      ret.pop();
    }
    doPush(ret, this.model.interval);
    if (isSus) {
      if (this.model.interval < 5) {
        ret.pop();
      }
      doPush(ret, this.model.quality);
      doPush(ret, this.model.susInterval || this.model.interval);
    }
    each(item => {
      if (item.action === 'add' ||
          item.action === 'omit' ||
          item.action === 'sus') {
        doPush(ret, item.action);
      }
      doPush(ret, convertAccidental(item.accidental));
      doPush(ret, item.interval);
    })(this.model.extra);
    if (this.model.bass) {
      doPush(ret, '/');
    }
    if (isAlt) {
      doPush(ret, this.model.quality);
    }
    doPush(ret, this.model.bass);
    doPush(ret, convertAccidental(this.model.bassModifier));

    return ret.join('');
  }
}

export default ChordParser;
