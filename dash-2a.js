
const estraiRiferimenti = (tipo,data) => {
  var dataset = data.filter((d) => d.tipo_riferimento === tipo);
  return estraiFiltro("riferimento", dataset);
};

const estraiFiltro = (column,data) => {
  return data.reduce(
    (values, row) =>
      values.indexOf(row[column]) === -1
        ? values.concat([row[column]])
        : values,
    []
  );
};

function estraiTotale(colonna,riferimenti,data) {
  return riferimenti.reduce(
    (obj, riferimento) => ({
      ...obj,
      [riferimento]: data
        .filter((d) => d.riferimento === riferimento)
        .reduce((somma, riga) => somma + riga[colonna], 0),
    }),
    {}
  );
}

function calcoloWi(TotalePesoClasse,riferimenti,data) {
  return riferimenti.reduce(
    (obj, riferimento) => ({
      ...obj,
      [riferimento]: data
        .filter((d) => d.riferimento === riferimento)
        .reduce(
          (somma, riga) => ({
            ...somma,
            [riga.classe_eta]:
              riga.peso_classe / TotalePesoClasse[riga.riferimento],
          }),
          {}
        ),
    }),
    {}
  );
}
function divTassoStandard(wi, riferimento,data) {
  return (
    data
      .filter((d) => d.riferimento === riferimento)
      .reduce(
        (somma, riga) =>
          somma +
          wi[riferimento][riga.classe_eta] *
            (riga.popolazione !== 0 ? riga.casi / riga.popolazione : 0),
        0
      ) /
    data
      .filter((d) => d.riferimento === riferimento)
      .reduce((somma, riga) => somma + wi[riferimento][riga.classe_eta], 0)
  );
}

function tassoStandard(wi,riferimenti,data,k = 1000) {
  return riferimenti.reduce(
    (obj, riferimento) => ({
      ...obj,
      [riferimento]: {
        ["tasso"]:
          k === 1000
            ? (divTassoStandard(wi, riferimento,data) * k).toFixed(2)
            : divTassoStandard(wi, riferimento,data) * k,
      },
    }),
    {}
  );
}

function calcoloEsLogTs(wi, tassoStandard,data,riferimenti) {
  return riferimenti.reduce(
    (obj, riferimento) => ({
      ...obj,
      [riferimento]:
        Math.sqrt(
          data
            .filter((d) => d.riferimento === riferimento)
            .reduce(
              (somma, riga) =>
                (somma +=
                  (Math.pow(wi[riferimento][riga.classe_eta], 2) * riga.casi) /
                  Math.pow(riga.popolazione, 2)),
              0
            )
        ) / tassoStandard[riferimento]["tasso"],
    }),
    {}
  );
}

function intervalloTs(riferimenti,data) {
  let tassi = tassoStandard(calcoloWi(estraiTotale("peso_classe",riferimenti,data),riferimenti,data),riferimenti,data, 1);
  let esLog = calcoloEsLogTs(calcoloWi(estraiTotale("peso_classe",riferimenti,data),riferimenti,data), tassi,data,riferimenti);
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
    obj.lcl = +(Math.exp(Math.log(tassi[el]["tasso"]) - valore) * 1000).toFixed(
      2
    );
    obj.ucl = +(Math.exp(Math.log(tassi[el]["tasso"]) + valore) * 1000).toFixed(
      2
    );
    obj.tasso = +(tassi[el]["tasso"] * 1000).toFixed(2);
    container[el] = obj;
  });
  return container;
}


function tassoGrezzo(casi, popolazione,riferimenti,data, k = 1000) {
  return riferimenti.reduce(
    (obj, riferimento) => ({
      ...obj,
      [riferimento]: data
        .filter((d) => d.riferimento === riferimento)
        .reduce(
          (somma, riga) => ({
            ...somma,
            ["tasso"]:
              k === 1000
                ? ((casi[riferimento] / popolazione[riferimento]) * k).toFixed(
                    2
                  )
                : (casi[riferimento] / popolazione[riferimento]) * k,
          }),
          {}
        ),
    }),
    {}
  );
}

function intervalloTg(riferimenti,data) {
  let tassi = tassoGrezzo(estraiTotale("casi",riferimenti,data), estraiTotale("popolazione",riferimenti,data),riferimenti,data, 1);
  let popolazione = estraiTotale("popolazione",riferimenti,data);
  let sqrt = 0;
  let container = {};
  let obj = {};
  riferimenti.forEach((el) => {
    obj = {
      tasso: 0,
      lcl: 0,
      ucl: 0,
    };
    sqrt = Math.sqrt(tassi[el]["tasso"] / popolazione[el]);
    obj.lcl = +(Math.max(0, tassi[el]["tasso"] - 1.96 * sqrt) * 1000).toFixed(
      2
    );
    obj.ucl = +(Math.min(1, tassi[el]["tasso"] + 1.96 * sqrt) * 1000).toFixed(
      2
    );
    obj.tasso = +(tassi[el]["tasso"] * 1000).toFixed(2);
    container[el] = obj;
  });
  return container;
}

function rischioRelativo(riferimenti,data) {
  let tassi =tassoStandard(calcoloWi(estraiTotale("peso_classe",riferimenti,data),riferimenti,data),riferimenti,data, 1);
  let puglia = tassi["Puglia"]["tasso"];
  let container = {};
  riferimenti.forEach((el) => {
    container[el] = +(tassi[el]["tasso"] / puglia).toFixed(4);
  });
  return container;
}

function intervalloRr(riferimenti,data) {
  let tassi = tassoStandard(calcoloWi(estraiTotale("peso_classe",riferimenti,data),riferimenti,data),riferimenti,data, 1);
  let rr = rischioRelativo(riferimenti,data);
  let puglia = tassi["Puglia"]["tasso"];
  let container = {};
  let esLog = calcoloEsLogTs(calcoloWi(estraiTotale("peso_classe",riferimenti,data),riferimenti,data), tassi,data,riferimenti);
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
