function raggruppaClassi(dataset) {
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


function estraiTotaleClassi(colonna, dataset, anni, gruppoEta) {
  let datatemp = null;
  let dataRif = null;
  let somma = 0;
  let container = {};
  let riferimenti = estraiFiltro("riferimento", dataset);

  if (riferimenti.length > 1 && colonna === "peso_classe") {
    dataRif = dataset.filter((d) => d.riferimento === dataset[0].riferimento);
  } else {
    dataRif = dataset;
  }
  anni.forEach((anno) => {
    container[anno] = {};
    gruppoEta.forEach((el) => {
      somma = 0;
      datatemp = dataRif.filter((d) => d.gruppo === el && d.anno === anno);
      datatemp.forEach((row) => {
        somma += row[colonna];
      });
      container[anno][el] = somma;
    });
  });
  return container;
}

function calcoloWiClassi(dataset, anni, gruppoEta, classiEta) {
  let totale = estraiTotaleClassi("peso_classe", dataset, anni, gruppoEta);
  let container = {};
  let datatemp = [];
  let div = 0;
  let valore = {};
  anni.forEach((anno) => {
    classiEta.forEach((el) => {
      valore = 0;
      datatemp = dataset.filter((d) => d.classe_eta === el && d.anno === anno);
      datatemp.forEach((riga) => {
        valore = riga.peso_classe / totale[anno][riga.gruppo];
      });
      container[el] = valore;
    });
  });
  return container;
}

function tassoStandardClassi(dataset, anni, gruppoEta, classiEta, k = 1000) {
  let datatemp = null;
  let wi = calcoloWiClassi(dataset, anni, gruppoEta, classiEta);
  let ti = 0;
  let sommatoria = {
    numeratore: 0,
    denominatore: 0,
  };
  let tassi = {};
  anni.forEach((anno) => {
    tassi[anno] = {};
    gruppoEta.forEach((el) => {
      sommatoria = {
        numeratore: 0,
        denominatore: 0,
      };
      datatemp = dataset.filter((d) => d.gruppo === el && d.anno === anno);
      datatemp.forEach((riga) => {
        ti = riga.popolazione !== 0 ? riga.casi / riga.popolazione : 0;
        sommatoria.numeratore += wi[riga.classe_eta] * ti;
        sommatoria.denominatore += wi[riga.classe_eta];
      });
      tassi[anno][el] = sommatoria.numeratore / sommatoria.denominatore;
      tassi[anno][el] =
        k !== 1000
          ? (tassi[anno][el] = tassi[anno][el] * k)
          : (tassi[anno][el] = +(tassi[anno][el] * k).toFixed(2));
    });
  });
  return tassi;
}

function tassoGrezzoClassi(dataset, anni, gruppoEta, k = 1000) {
  let casi = estraiTotaleClassi("casi", dataset, anni, gruppoEta);
  let popolazione = estraiTotaleClassi("popolazione", dataset, anni, gruppoEta);
  let tasso = {};
  anni.forEach((anno) => {
    tasso[anno] = {};
    gruppoEta.forEach((el) => {
      tasso[anno][el] = casi[anno][el] / popolazione[anno][el];
      tasso[anno][el] =
        k !== 1000
          ? (tasso[anno][el] = tasso[anno][el] * k)
          : (tasso[anno][el] = +(tasso[anno][el] * k).toFixed(2));
    });
  });
  return tasso;
}

function intervalloTg(dataset, anni, gruppoEta) {
  let tassi = tassoGrezzoClassi(dataset, anni, gruppoEta, 1);
  let popolazione = estraiTotaleClassi("popolazione", dataset, anni, gruppoEta);
  let sqrt = 0;
  let container = {};
  let obj = {};
  anni.forEach((el) => {
    container[el] = {};
    gruppoEta.forEach((eta) => {
      obj = {
        tasso: 0,
        lcl: 0,
        ucl: 0,
      };
      sqrt = Math.sqrt(tassi[el][eta] / popolazione[el][eta]);
      obj.lcl = +(Math.max(0, tassi[el][eta] - 1.96 * sqrt) * 1000).toFixed(2);
      obj.ucl = +(Math.min(1, tassi[el][eta] + 1.96 * sqrt) * 1000).toFixed(2);
      obj.tasso = +(tassi[el][eta] * 1000).toFixed(2);
      container[el][eta] = obj;
    });
  });
  return container;
}

function calcoloEsLogTs(dataset, anni, gruppoEta, classiEta) {
  let datatemp = null;
  let wi = calcoloWiClassi(dataset, anni, gruppoEta, classiEta);
  let tassi = tassoStandardClassi(dataset, anni, gruppoEta, classiEta, 1);
  let sommatoria = 0;
  let es = {};
  let valore = 0;
  anni.forEach((el) => {
    es[el] = {};
    gruppoEta.forEach((eta) => {
      datatemp = dataset.filter((d) => d.anno === el && d.gruppo === eta);
      sommatoria = 0;
      datatemp.forEach((riga) => {
        valore = riga.casi / Math.pow(riga.popolazione, 2);
        sommatoria += Math.pow(wi[riga.classe_eta], 2) * valore;
      });
      sommatoria = Math.sqrt(sommatoria);
      es[el][eta] = sommatoria / tassi[el][eta];
    });
  });
  return es;
}

function intervalloTs(dataset, anni, gruppoEta, classiEta) {
  let tassi = tassoStandardClassi(dataset, anni, gruppoEta, classiEta, 1);
  let esLog = calcoloEsLogTs(dataset, anni, gruppoEta, classiEta);
  let container = {};
  let valore = 0;
  let obj = {};
  anni.forEach((el) => {
    container[el] = {};
    gruppoEta.forEach((eta) => {
      obj = {
        tasso: 0,
        lcl: 0,
        ucl: 0,
      };
      valore = 1.96 * esLog[el][eta];
      obj.lcl = +(Math.exp(Math.log(tassi[el][eta]) - valore) * 1000).toFixed(
        2
      );
      obj.ucl = +(Math.exp(Math.log(tassi[el][eta]) + valore) * 1000).toFixed(
        2
      );
      obj.tasso = +(tassi[el][eta] * 1000).toFixed(2);
      container[el][eta] = obj;
    });
  });
  return container;
}

const estraiFiltro = (column, dataset) => {
  return dataset.reduce(
    (values, row) =>
      values.indexOf(row[column]) === -1
        ? values.concat([row[column]])
        : values,
    []
  );
};
