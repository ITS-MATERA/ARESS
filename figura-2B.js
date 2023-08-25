function estraiTotalePrevalenzaDistretti(colonna, data, riferimenti) {
    let dataset = null;
    let somma = 0;
    let container = {};
    riferimenti.forEach((el) => {
      somma = 0;
      dataset = data.filter((d) => d.riferimento === el);
      dataset.forEach((row) => (somma += row[colonna]));
      container[el] = somma;
    });
    return container;
  }
  
  function calcoloWiPrevalenzaDistretti(data, riferimenti) {
    let container = estraiTotalePrevalenzaDistretti("peso_classe", data, riferimenti);
    let dataset = [];
    let div = 0;
    let obj = {};
    riferimenti.forEach((el) => {
      obj = {};
      dataset = data.filter((d) => d.riferimento === el);
      dataset.forEach((riga) => {
        obj[riga.classe_eta] = riga.peso_classe / container[riga.riferimento];
      });
      container[el] = obj;
    });
    return container;
  }
  
  function tassoStandardPrevalenzaDistretti(data, riferimenti, k = 1000) {
    let dataset = null;
    let wi = calcoloWiPrevalenzaDistretti(data, riferimenti);
    let ti = 0;
    let sommatoria = {
      numeratore: 0,
      denominatore: 0,
    };
    let tassi = {};
    riferimenti.forEach((el) => {
      sommatoria = {
        numeratore: 0,
        denominatore: 0,
      };
      dataset = data.filter((d) => d.riferimento === el);
      dataset.forEach((riga) => {
        ti = riga.popolazione !== 0 ? riga.casi / riga.popolazione : 0;
        sommatoria.numeratore += wi[el][riga.classe_eta] * ti;
        sommatoria.denominatore += wi[el][riga.classe_eta];
      });
      tassi[el] = sommatoria.numeratore / sommatoria.denominatore;
      tassi[el] =
        k !== 1000
          ? (tassi[el] = tassi[el] * k)
          : (tassi[el] = +(tassi[el] * k).toFixed(2));
    });
    return tassi;
  }
  
  function tassoGrezzoPrevalenzaDistretti(data, riferimenti, k = 1000) {
    let casi = estraiTotalePrevalenzaDistretti("casi", data, riferimenti);
    let popolazione = estraiTotalePrevalenzaDistretti("popolazione", data, riferimenti);
    let tasso = {};
    riferimenti.forEach((el) => {
      tasso[el] = casi[el] / popolazione[el];
      tasso[el] =
        k !== 1000
          ? (tasso[el] = tasso[el] * k)
          : (tasso[el] = +(tasso[el] * k).toFixed(2));
    });
    return tasso;
  }
  
  function intervalloTgPrevalenzaDistretti(data, riferimenti) {
    let tassi = tassoGrezzoPrevalenzaDistretti(data, riferimenti, 1);
    let popolazione = estraiTotalePrevalenzaDistretti("popolazione", data, riferimenti);
    let sqrt = 0;
    let container = {};
    let obj = {};
    riferimenti.forEach((el) => {
      obj = {
        tasso: 0,
        lcl: 0,
        ucl: 0,
      };
      sqrt = Math.sqrt(tassi[el] / popolazione[el]);
      obj.lcl = +(Math.max(0, tassi[el] - 1.96 * sqrt) * 1000).toFixed(2);
      obj.ucl = +(Math.min(1, tassi[el] + 1.96 * sqrt) * 1000).toFixed(2);
      obj.tasso = +(tassi[el] * 1000).toFixed(2);
      container[el] = obj;
    });
    return container;
  }
  
  function calcoloEsLogTsPrevalenzaDistretti(data, riferimenti) {
    let dataset = null;
    let wi = calcoloWiPrevalenzaDistretti(data, riferimenti);
    let tassi = tassoStandardPrevalenzaDistretti(data, riferimenti, 1);
    let sommatoria = 0;
    let es = {};
    let valore = 0;
    riferimenti.forEach((el) => {
      dataset = data.filter((d) => d.riferimento === el);
      sommatoria = 0;
      dataset.forEach((riga) => {
        valore = riga.casi / Math.pow(riga.popolazione, 2);
        sommatoria += Math.pow(wi[el][riga.classe_eta], 2) * valore;
      });
      sommatoria = Math.sqrt(sommatoria);
      es[el] = sommatoria / tassi[el];
    });
    return es;
  }
  
  function intervalloTsPrevalenzaDistretti(data, riferimenti) {
    let tassi = tassoStandardPrevalenzaDistretti(data, riferimenti, 1);
    let esLog = calcoloEsLogTsPrevalenzaDistretti(data, riferimenti);
    let container = {};
    let valore = 0;
    let obj = {};
    riferimenti.forEach((el) => {
      obj = {
        tasso: 0,
        lcl: 0,
        ucl: 0,
      };
      valore = 1.96 * esLog[el];
      obj.lcl = +(Math.exp(Math.log(tassi[el]) - valore) * 1000).toFixed(2);
      obj.ucl = +(Math.exp(Math.log(tassi[el]) + valore) * 1000).toFixed(2);
      obj.tasso = +(tassi[el] * 1000).toFixed(2);
      container[el] = obj;
    });
    return container;
  }
  
  function rischioRelativoPrevalenzaDistretti(data, riferimenti) {
    let tassi = tassoStandardPrevalenzaDistretti(data, riferimenti, 1);
    let puglia = tassi["Puglia"];
    let container = {};
    riferimenti.forEach((el) => {
      container[el] = +(tassi[el] / puglia).toFixed(4);
    });
    return container;
  }
  
  function intervalloRrPrevalenzaDistretti(data, riferimenti) {
    // let tassi = tassoStandardPrevalenzaDistretti(data, riferimenti,1);
    let rr = rischioRelativoPrevalenzaDistretti(data, riferimenti);
    // let puglia = tassi['Puglia'];
    let container = {};
    let esLog = calcoloEsLogTsPrevalenzaDistretti(data, riferimenti);
    let esRr = 0;
    let obj = {};
    riferimenti.forEach((el) => {
      obj = {
        tasso: 0,
        lcl: 0,
        ucl: 0,
      };
      esRr = Math.sqrt(Math.pow(esLog[el], 2) + Math.pow(esLog["Puglia"], 2));
      obj.tasso = rr[el];
      obj.lcl = +Math.exp(Math.log(rr[el]) - 1.96 * esRr).toFixed(4);
      obj.ucl = +Math.exp(Math.log(rr[el]) + 1.96 * esRr).toFixed(4);
      container[el] = obj;
    });
    return container;
  }
