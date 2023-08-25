function raggruppaClassiPrevalenzaEtaGenere(dataset) {
    var temp = dataset.filter(
      (d) =>
        d.classe_eta === "40-44" ||
        d.classe_eta === "45-49" ||
        d.classe_eta === "50-54" ||
        d.classe_eta === "55-59"
    );
    temp.forEach((riga) => {
      riga["gruppo"] = "40-59";
    });
    var temp2 = dataset.filter(
      (d) => d.classe_eta === "60-64" || d.classe_eta === "65-69"
    );
    temp2.forEach((riga) => {
      riga["gruppo"] = "60-69";
    });
    temp = temp.concat(temp2);
    temp2 = dataset.filter(
      (d) => d.classe_eta === "70-74" || d.classe_eta === "75-79"
    );
    temp2.forEach((riga) => {
      riga["gruppo"] = "70-79";
    });
    temp = temp.concat(temp2);
    temp2 = dataset.filter(
      (d) => d.classe_eta === "80-84" || d.classe_eta === ">=85"
    );
    temp2.forEach((riga) => {
      riga["gruppo"] = ">=80";
    });
    temp = temp.concat(temp2);
  
    return temp;
  }
  
  
  function estraiTotaleClassiPrevalenzaEtaGenere(dataNew, chiavi, colonna, sesso = "Maschi") {
    let dataset = null;
    let dataRif = null;
    let somma = 0;
    let container = {};
    const riferimenti = dataNew.reduce(
      (l, i) => (l.indexOf(i.riferimento) !== -1 ? l : l.concat([i.riferimento])),
      []
    );
    if (riferimenti.length > 1 && colonna === "peso_classe") {
      dataRif = dataNew.filter((d) => d.riferimento === dataNew[0].riferimento);
    } else {
      dataRif = dataNew;
    }
    chiavi.forEach((el) => {
      somma = 0;
      dataset = dataRif.filter((d) => d.gruppo === el && d.sesso === sesso);
      dataset.forEach((row) => (somma += row[colonna]));
      container[el] = somma;
    });
    return container;
  }
  
  function calcoloWiClassiPrevalenzaEtaGenere(dataNew, chiavi, classiEta, sesso) {
    let totale = estraiTotaleClassiPrevalenzaEtaGenere(dataNew, chiavi, "peso_classe", sesso);
    let container = {};
    let dataset = [];
    let div = 0;
    let valore = {};
    classiEta.forEach((el) => {
      valore = 0;
      dataset = dataNew.filter((d) => d.classe_eta === el);
      dataset.forEach((riga) => {
        valore = riga.peso_classe / totale[riga.gruppo];
      });
      container[el] = valore;
    });
    return container;
  }
  
  function tassoStandardClassiPrevalenzaEtaGenere(
    dataNew,
    chiavi,
    classiEta,
    sesso = "Maschi",
    k = 1000
  ) {
    let dataset = null;
    let wi = calcoloWiClassiPrevalenzaEtaGenere(dataNew, chiavi, classiEta, sesso);
    let ti = 0;
    let sommatoria = {
      numeratore: 0,
      denominatore: 0,
    };
    let tassi = {};
    chiavi.forEach((el) => {
      sommatoria = {
        numeratore: 0,
        denominatore: 0,
      };
      dataset = dataNew.filter((d) => d.gruppo === el && d.sesso === sesso);
      dataset.forEach((riga) => {
        ti = riga.popolazione !== 0 ? riga.casi / riga.popolazione : 0;
        sommatoria.numeratore += wi[riga.classe_eta] * ti;
        sommatoria.denominatore += wi[riga.classe_eta];
      });
      tassi[el] = sommatoria.numeratore / sommatoria.denominatore;
      tassi[el] =
        k !== 1000
          ? (tassi[el] = tassi[el] * k)
          : (tassi[el] = +(tassi[el] * k).toFixed(2));
    });
    return tassi;
  }
  
  function tassoGrezzoClassiPrevalenzaEtaGenere(dataNew, chiavi, sesso = "Maschi", k = 1000) {
    let casi = estraiTotaleClassiPrevalenzaEtaGenere(dataNew, chiavi, "casi", sesso);
    let popolazione = estraiTotaleClassiPrevalenzaEtaGenere(dataNew, chiavi, "popolazione", sesso);
    let tasso = {};
    chiavi.forEach((el) => {
      tasso[el] = casi[el] / popolazione[el];
      tasso[el] =
        k !== 1000
          ? (tasso[el] = tasso[el] * k)
          : (tasso[el] = +(tasso[el] * k).toFixed(2));
    });
    return tasso;
  }
  
  function intervalloTgClassiPrevalenzaEtaGenere(dataNew, chiavi, sesso = "Maschi") {
    let tassi = tassoGrezzoClassiPrevalenzaEtaGenere(dataNew, chiavi, sesso, 1);
    let popolazione = estraiTotaleClassiPrevalenzaEtaGenere(dataNew, chiavi, "popolazione", sesso);
    let sqrt = 0;
    let container = {};
    let obj = {};
    chiavi.forEach((el) => {
      container[el] = {};
      chiavi.forEach((eta) => {
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
    });
    return container;
  }
  
  function calcoloEsLogTsClassiPrevalenzaEtaGenere(dataNew, chiavi, classiEta, sesso = "Maschi") {
    let dataset = null;
    let wi = calcoloWiClassiPrevalenzaEtaGenere(dataNew, chiavi, classiEta, sesso);
    let tassi = tassoStandardClassiPrevalenzaEtaGenere(dataNew, chiavi, classiEta, sesso, 1);
    let sommatoria = 0;
    let es = {};
    let valore = 0;
    chiavi.forEach((el) => {
      dataset = dataNew.filter((d) => d.sesso === sesso && d.gruppo === el);
      sommatoria = 0;
      dataset.forEach((riga) => {
        valore = riga.casi / Math.pow(riga.popolazione, 2);
        sommatoria += Math.pow(wi[riga.classe_eta], 2) * valore;
      });
      sommatoria = Math.sqrt(sommatoria);
      es[el] = sommatoria / tassi[el];
    });
    return es;
  }
  
  function intervalloTsClassiPrevalenzaEtaGenere(dataNew, chiavi, classiEta, sesso = "Maschi") {
    let tassi = tassoStandardClassiPrevalenzaEtaGenere(dataNew, chiavi, classiEta, sesso, 1);
    let esLog = calcoloEsLogTsClassiPrevalenzaEtaGenere(dataNew, chiavi, classiEta, sesso);
    let container = {};
    let valore = 0;
    let obj = {};
    chiavi.forEach((el) => {
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
  
  function estraiTotalePrevalenzaEtaGenere(dataNew, colonna, sesso = "Maschi") {
    let dataset = null;
    let dataRif = null;
    let somma = 0;
    const riferimenti = dataNew.reduce(
      (l, i) => (l.indexOf(i.riferimento) !== -1 ? l : l.concat([i.riferimento])),
      []
    );
    if (riferimenti.length > 1 && colonna === "peso_classe") {
      dataRif = dataNew.filter((d) => d.riferimento === dataNew[0].riferimento);
    } else {
      dataRif = dataNew;
    }
    dataset = dataRif.filter((d) => d.sesso === sesso);
    dataset.forEach((row) => (somma += row[colonna]));
    return somma;
  }
  
  function calcoloWiPrevalenzaEtaGenere(dataNew, sesso = "Maschi") {
    let container = estraiTotalePrevalenzaEtaGenere(dataNew, "peso_classe", sesso);
    let dataset = [];
    let div = 0;
    let obj = {};
    dataset = dataNew.filter((d) => d.sesso === sesso);
    dataset.forEach((riga) => {
      obj[riga.classe_eta] = riga.peso_classe / container;
    });
    return obj;
  }
  
  function tassoStandardPrevalenzaEtaGenere(dataNew, sesso = "Maschi", k = 1000) {
    let dataset = null;
    let wi = calcoloWiPrevalenzaEtaGenere(dataNew, sesso);
    let ti = 0;
    let sommatoria = {
      numeratore: 0,
      denominatore: 0,
    };
    let tassi = 0;
    dataset = dataNew.filter((d) => d.sesso === sesso);
    dataset.forEach((riga) => {
      ti = riga.casi / riga.popolazione;
      sommatoria.numeratore += wi[riga.classe_eta] * ti;
      sommatoria.denominatore += wi[riga.classe_eta];
    });
    tassi = sommatoria.numeratore / sommatoria.denominatore;
    tassi = k !== 1000 ? (tassi = tassi * k) : (tassi = +(tassi * k).toFixed(2));
    return tassi;
  }
  
  function tassoGrezzoPrevalenzaEtaGenere(dataNew, sesso = "Maschi", k = 1000) {
    let casi = estraiTotalePrevalenzaEtaGenere(dataNew, "casi", sesso);
    let popolazione = estraiTotalePrevalenzaEtaGenere(dataNew, "popolazione", sesso);
    let tasso = 0;
    tasso = casi / popolazione;
    tasso = k !== 1000 ? (tasso = tasso * k) : (tasso = +(tasso * k).toFixed(2));
    return tasso;
  }
  
  function intervalloTgPrevalenzaEtaGenere(dataNew, sesso = "Maschi") {
    let tassi = tassoGrezzoPrevalenzaEtaGenere(dataNew, sesso, 1);
    let popolazione = estraiTotalePrevalenzaEtaGenere(dataNew, "popolazione", sesso);
    let obj = {
      tasso: 0,
      lcl: 0,
      ucl: 0,
    };
    let sqrt = Math.sqrt(tassi / popolazione);
    obj.lcl = +(Math.max(0, tassi - 1.96 * sqrt) * 1000).toFixed(2);
    obj.ucl = +(Math.min(1, tassi + 1.96 * sqrt) * 1000).toFixed(2);
    obj.tasso = +(tassi * 1000).toFixed(2);
    return obj;
  }
  
  function calcoloEsLogTsPrevalenzaEtaGenere(dataNew, sesso = "Maschi") {
    let dataset = null;
    let wi = calcoloWiPrevalenzaEtaGenere(dataNew, sesso);
    let tassi = tassoStandardPrevalenzaEtaGenere(dataNew, sesso, 1);
    let valore = 0;
    dataset = dataNew.filter((d) => d.sesso === sesso);
    let sommatoria = 0;
    dataset.forEach((riga) => {
      valore = riga.casi / Math.pow(riga.popolazione, 2);
      sommatoria += Math.pow(wi[riga.classe_eta], 2) * valore;
    });
    sommatoria = Math.sqrt(sommatoria);
  
    return sommatoria / tassi;
  }
  
  function intervalloTsPrevalenzaEtaGenere(dataNew, sesso = "Maschi") {
    let tassi = tassoStandardPrevalenzaEtaGenere(dataNew, sesso, 1);
    let esLog = calcoloEsLogTsPrevalenzaEtaGenere(dataNew, sesso);
    let obj = {
      tasso: 0,
      lcl: 0,
      ucl: 0,
    };
    let valore = 1.96 * esLog;
    obj.lcl = +(Math.exp(Math.log(tassi) - valore) * 1000).toFixed(2);
    obj.ucl = +(Math.exp(Math.log(tassi) + valore) * 1000).toFixed(2);
    obj.tasso = +(tassi * 1000).toFixed(2);
    return obj;
  }
