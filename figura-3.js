function estraiTotaleTrendArea(colonna, riferimenti, anni, data) {
    let dataset = null;
    let somma = 0;
    let container = {};
    riferimenti.forEach((riferimento) => {
      container[riferimento] = {};
      anni.forEach((el) => {
        somma = 0;
        dataset = data.filter(
          (d) => d.anno === el && d.riferimento === riferimento
        );
        dataset.forEach((row) => (somma += row[colonna]));
        container[riferimento][el] = somma;
      });
    });
    return container;
  }
  
  function estraiTotaleAreaTrendArea(colonna, anni, data) {
    let dataset = null;
    let somma = 0;
    let container = {
      Area: {},
    };
    anni.forEach((el) => {
      somma = 0;
      dataset =
        colonna === "peso_classe"
          ? data.filter(
              (d) => d.anno === el && d.riferimento === data[0].riferimento
            )
          : data.filter((d) => d.anno === el);
      dataset.forEach((row) => (somma += row[colonna]));
      container["Area"][el] = somma;
    });
    return container;
  }
  
  function calcoloWiTrendArea(riferimenti, anni, data) {
    let pesi = estraiTotaleTrendArea("peso_classe", riferimenti, anni, data);
    let dataset = [];
    let div = 0;
    let obj = {};
    let container = {};
    riferimenti.forEach((riferimento) => {
      container[riferimento] = {};
      anni.forEach((el) => {
        obj = {};
        dataset = data.filter(
          (d) => d.anno === el && d.riferimento === riferimento
        );
        dataset.forEach((riga) => {
          obj[riga.classe_eta] = riga.peso_classe / pesi[riferimento][riga.anno];
        });
        container[riferimento][el] = obj;
      });
    });
    return container;
  }
  
  function calcoloWiAreaTrendArea(anni, data) {
    let pesi = estraiTotaleAreaTrendArea("peso_classe", anni, data);
    let div = 0;
    let obj = {};
    let container = {
      Area: {},
    };
    anni.forEach((el) => {
      obj = {};
      data.forEach((riga) => {
        obj[riga.classe_eta] = riga.peso_classe / pesi["Area"][riga.anno];
      });
      container["Area"][el] = obj;
    });
    return container;
  }
  
  function tassoStandardTrendArea(riferimenti, anni, data, k = 1000) {
    let dataset = null;
    let wi = calcoloWiTrendArea(riferimenti, anni, data);
    let ti = 0;
    let sommatoria = {
      numeratore: 0,
      denominatore: 0,
    };
    let tassi = {};
    riferimenti.forEach((riferimento) => {
      tassi[riferimento] = {};
      anni.forEach((el) => {
        sommatoria = {
          numeratore: 0,
          denominatore: 0,
        };
        dataset = data.filter(
          (d) => d.anno === el && d.riferimento === riferimento
        );
        dataset.forEach((riga) => {
          ti = riga.popolazione !== 0 ? riga.casi / riga.popolazione : 0;
          sommatoria.numeratore += wi[riferimento][el][riga.classe_eta] * ti;
          sommatoria.denominatore += wi[riferimento][el][riga.classe_eta];
        });
        tassi[riferimento][el] = sommatoria.numeratore / sommatoria.denominatore;
        tassi[riferimento][el] =
          k !== 1000
            ? (tassi[riferimento][el] = tassi[riferimento][el] * k)
            : (tassi[riferimento][el] = +(tassi[riferimento][el] * k).toFixed(2));
      });
    });
  
    return tassi;
  }
  
  function tassoStandardAreaTrendArea(anni, data, k = 1000) {
    let dataset = null;
    let wi = calcoloWiAreaTrendArea(anni, data);
    let ti = 0;
    let sommatoria = {
      numeratore: 0,
      denominatore: 0,
    };
    let tassi = {
      Area: {},
    };
    let classi = [];
    anni.forEach((el) => {
      classi = [];
      sommatoria = {
        numeratore: 0,
        denominatore: 0,
      };
      dataset = data.filter((d) => d.anno === el);
      classi = dataset.reduce(
        (l, i) => (l.indexOf(i.classe_eta) !== -1 ? l : l.concat([i.classe_eta])),
        []
      );
      classi.sort();
      classi.forEach((classe) => {
        let casi = 0;
        let popolazione = 0;
        dataset.forEach((riga) => {
          if (riga.classe_eta === classe) {
            casi += riga.casi;
            popolazione += riga.popolazione;
          }
        });
        ti = popolazione !== 0 ? casi / popolazione : 0;
        sommatoria.numeratore += wi["Area"][el][classe] * ti;
        sommatoria.denominatore += wi["Area"][el][classe];
      });
      tassi["Area"][el] = sommatoria.numeratore / sommatoria.denominatore;
      tassi["Area"][el] =
        k !== 1000
          ? (tassi["Area"][el] = tassi["Area"][el] * k)
          : (tassi["Area"][el] = +(tassi["Area"][el] * k).toFixed(2));
    });
    return tassi;
  }
  
  function tassoGrezzoTrendArea(riferimenti, anni, data, k = 1000) {
    let casi = estraiTotaleTrendArea("casi", riferimenti, anni, data);
    let popolazione = estraiTotaleTrendArea("popolazione", riferimenti, anni, data);
    let tasso = {};
    riferimenti.forEach((riferimento) => {
      tasso[riferimento] = {};
      anni.forEach((el) => {
        tasso[riferimento][el] =
          casi[riferimento][el] / popolazione[riferimento][el];
        tasso[riferimento][el] =
          k !== 1000
            ? (tasso[riferimento][el] = tasso[riferimento][el] * k)
            : (tasso[riferimento][el] = +(tasso[riferimento][el] * k).toFixed(2));
      });
    });
    return tasso;
  }
  
  function tassoGrezzoAreaTrendArea(anni, data, k = 1000) {
    let casi = estraiTotaleAreaTrendArea("casi", anni, data);
    let popolazione = estraiTotaleAreaTrendArea("popolazione", anni, data);
    let tasso = {
      Area: {},
    };
    anni.forEach((el) => {
      tasso["Area"][el] = casi["Area"][el] / popolazione["Area"][el];
      tasso["Area"][el] =
        k !== 1000
          ? (tasso["Area"][el] = tasso["Area"][el] * k)
          : (tasso["Area"][el] = +(tasso["Area"][el] * k).toFixed(2));
    });
    return tasso;
  }
  
  function intervalloTgTrendArea(riferimenti, anni, data) {
    let tassi = tassoGrezzoTrendArea(riferimenti, anni, data, 1);
    let popolazione = estraiTotaleTrendArea("popolazione", riferimenti, anni, data);
    let sqrt = 0;
    let container = {};
    let obj = {};
    riferimenti.forEach((el) => {
      container[el] = {};
      anni.forEach((rif) => {
        obj = {
          tasso: 0,
          lcl: 0,
          ucl: 0,
        };
        sqrt = Math.sqrt(tassi[el][rif] / popolazione[el][rif]);
        obj.lcl = +(Math.max(0, tassi[el][rif] - 1.96 * sqrt) * 1000).toFixed(2);
        obj.ucl = +(Math.min(1, tassi[el][rif] + 1.96 * sqrt) * 1000).toFixed(2);
        obj.tasso = +(tassi[el][rif] * 1000).toFixed(2);
        container[el][rif] = obj;
      });
    });
    return container;
  }
  
  function intervalloTgAreaTrendArea(anni, data) {
    let tassi = tassoGrezzoAreaTrendArea(anni, data, 1);
    let popolazione = estraiTotaleAreaTrendArea("popolazione", anni, data);
    let sqrt = 0;
    let container = {
      Area: {},
    };
    let obj = {};
    anni.forEach((el) => {
      container["Area"][el] = {};
      obj = {
        tasso: 0,
        lcl: 0,
        ucl: 0,
      };
      sqrt = Math.sqrt(tassi["Area"][el] / popolazione["Area"][el]);
      obj.lcl = +(Math.max(0, tassi["Area"][el] - 1.96 * sqrt) * 1000).toFixed(2);
      obj.ucl = +(Math.min(1, tassi["Area"][el] + 1.96 * sqrt) * 1000).toFixed(2);
      obj.tasso = +(tassi["Area"][el] * 1000).toFixed(2);
      container["Area"][el] = obj;
    });
    return container;
  }
  
  function calcoloEsLogTsTrendArea(riferimenti, anni, data) {
    let dataset = null;
    let wi = calcoloWiTrendArea(riferimenti, anni, data);
    let tassi = tassoStandardTrendArea(riferimenti, anni, data, 1);
    let sommatoria = 0;
    let es = {};
    let valore = 0;
    riferimenti.forEach((el) => {
      es[el] = {};
      anni.forEach((rif) => {
        dataset = data.filter((d) => d.riferimento === el && d.anno === rif);
        sommatoria = 0;
        dataset.forEach((riga) => {
          valore = riga.casi / Math.pow(riga.popolazione, 2);
          sommatoria += Math.pow(wi[el][rif][riga.classe_eta], 2) * valore;
        });
        sommatoria = Math.sqrt(sommatoria);
        es[el][rif] = sommatoria / tassi[el][rif];
      });
    });
    return es;
  }
  
  function calcoloEsLogTsAreaTrendArea(anni, data) {
    let dataset = null;
    let wi = calcoloWiAreaTrendArea(anni, data);
    let tassi = tassoStandardAreaTrendArea(anni, data, 1);
    let sommatoria = 0;
    let es = {
      Area: {},
    };
    let valore = 0;
    anni.forEach((el) => {
      es["Area"][el] = {};
      dataset = data.filter((d) => d.anno === el);
      sommatoria = 0;
      dataset.forEach((riga) => {
        valore = riga.casi / Math.pow(riga.popolazione, 2);
        sommatoria += Math.pow(wi["Area"][el][riga.classe_eta], 2) * valore;
      });
      sommatoria = Math.sqrt(sommatoria);
      es["Area"][el] = sommatoria / tassi["Area"][el];
    });
    return es;
  }
  
  function intervalloTsTrendArea(riferimenti, anni, data) {
    let tassi = tassoStandardTrendArea(riferimenti, anni, data, 1);
    let esLog = calcoloEsLogTsTrendArea(riferimenti, anni, data);
    let container = {};
    let valore = 0;
    let obj = {};
    riferimenti.forEach((el) => {
      container[el] = {};
      anni.forEach((anno) => {
        obj = {
          tasso: 0,
          lcl: 0,
          ucl: 0,
        };
        valore = 1.96 * esLog[el][anno];
        obj.lcl = +(Math.exp(Math.log(tassi[el][anno]) - valore) * 1000).toFixed(
          2
        );
        obj.ucl = +(Math.exp(Math.log(tassi[el][anno]) + valore) * 1000).toFixed(
          2
        );
        obj.tasso = +(tassi[el][anno] * 1000).toFixed(2);
        container[el][anno] = obj;
      });
    });
    return container;
  }
  
  function intervalloTsAreaTrendArea(anni, data) {
    let tassi = tassoStandardAreaTrendArea(anni, data, 1);
    let esLog = calcoloEsLogTsAreaTrendArea(anni, data);
    let container = {
      Area: {},
    };
    let valore = 0;
    let obj = {};
    anni.forEach((el) => {
      container["Area"][el] = {};
      obj = {
        tasso: 0,
        lcl: 0,
        ucl: 0,
      };
      valore = 1.96 * esLog["Area"][el];
      obj.lcl = +(Math.exp(Math.log(tassi["Area"][el]) - valore) * 1000).toFixed(
        2
      );
      obj.ucl = +(Math.exp(Math.log(tassi["Area"][el]) + valore) * 1000).toFixed(
        2
      );
      obj.tasso = +(tassi["Area"][el] * 1000).toFixed(2);
      container["Area"][el] = obj;
    });
    return container;
  }
