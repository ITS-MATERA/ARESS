function estraiTotalePrevalenzaGenere(data,anni,colonna, sesso = 'Maschi'){
    let dataset = null;
    let somma = 0;
    let container = {};
    anni.forEach(
      el => {
        somma = 0;
        dataset = colonna === 'peso_classe' 
            ? data.filter(
                d => d.anno === el && d.sesso === sesso && d.riferimento === data[0].riferimento
              )
            : data.filter(
              d => d.anno === el && d.sesso === sesso
            );
        dataset.forEach( row => somma += row[colonna]);
        container[el] = somma;
      }
    );
    return container;
  }
  
  function calcoloWiPrevalenzaGenere(data,anni){
    let container = estraiTotalePrevalenzaGenere(data,anni,'peso_classe');
    let dataset = [];
    let div = 0;
    let obj = {};
    anni.forEach(
      el => {
        obj = {};
        dataset = data.filter(
          d => d.anno === el
        );
        dataset.forEach((riga) => {
          obj[riga.classe_eta] =
            riga.peso_classe / container[riga.anno];
        });
        container[el] = obj;
      }
    );
    return container;
  }
  
  
  function tassoStandardPrevalenzaGenere(data,anni,k = 1000, sesso = 'Maschi'){
    let dataset = null;
    let wi = calcoloWiPrevalenzaGenere(data,anni);
    let ti = 0;
    let sommatoria = {
      numeratore: 0,
      denominatore: 0
    };
    let tassi = {};
    anni.forEach(
      el => {
        sommatoria.numeratore = 0;
        sommatoria.denominatore = 0;
        dataset = data.filter(
          d => d.anno === el && d.sesso === sesso 
        );
        classi = dataset.reduce((l, i) => 
          l.indexOf(i.classe_eta) !== -1 
            ? l 
            : l.concat([i.classe_eta]), 
          []
        ); 
        classi.sort();
        classi.forEach( classe => {
          let casi = 0;
          let popolazione = 0;
          dataset.forEach( riga => {
            if(riga.classe_eta === classe){
              casi += riga.casi;
              popolazione += riga.popolazione;
            }
          });
          ti = popolazione !== 0 ? casi / popolazione : 0;
          sommatoria.numeratore += 
            wi[el][classe] * ti;
          sommatoria.denominatore += 
            wi[el][classe];
        });
        tassi[el] = 
          sommatoria.numeratore 
          / 
          sommatoria.denominatore ;
          
        tassi[el] = 
          k !== 1000 ?
            tassi[el] = tassi[el] * k
          :
            tassi[el] = +(tassi[el] * k).toFixed(2);
      }
    );
    return tassi;
  }
  
  function tassoGrezzoPrevalenzaGenere(data,anni,k = 1000, sesso = 'Maschi') {
    let casi = estraiTotalePrevalenzaGenere(data,anni,'casi', sesso);
    let popolazione = estraiTotalePrevalenzaGenere(data,anni,'popolazione', sesso);
    let tasso = {};
    anni.forEach( el => {
      tasso[el] = casi[el] / popolazione[el];
      tasso[el] = 
        k !== 1000 ?
          tasso[el] = tasso[el] * k
        : 
          tasso[el] = +(tasso[el] * k).toFixed(2);
    });
    return tasso;
  }
  
  function intervalloTgPrevalenzaGenere(data,anni,sesso = 'Maschi') {
    let tassi = tassoGrezzoPrevalenzaGenere(data,anni,1, sesso);
    let popolazione = estraiTotalePrevalenzaGenere(data,anni,'popolazione', sesso);
    let sqrt = 0;
    let container = {};
    let obj = {};
    anni.forEach( el => {
      obj = {
        tasso: 0,
        lcl: 0,
        ucl: 0
      };
      sqrt = Math.sqrt(tassi[el]/popolazione[el]);
      obj.lcl = +(Math.max(0, (tassi[el] - (1.96 * sqrt))) * 1000).toFixed(2);
      obj.ucl = +(Math.min(1, (tassi[el] + (1.96 * sqrt))) * 1000).toFixed(2);
      obj.tasso = +(tassi[el] * 1000).toFixed(2);
      container[el] = obj;
    });
    return container;
  }
  
  function calcoloEsLogTsPrevalenzaGenere(data,anni,sesso = 'Maschi'){
    let dataset = null;
    let wi = calcoloWiPrevalenzaGenere(data,anni);
    let tassi = tassoStandardPrevalenzaGenere(data,anni,1, sesso);
    let sommatoria = 0;
    let es = {};
    let valore = 0;
    anni.forEach(
      el => {
        dataset = data.filter(
          d => d.anno === el && d.sesso === sesso
        );
        sommatoria = 0;
        dataset.forEach( riga => {
          valore = riga.casi / Math.pow(riga.popolazione, 2);
          sommatoria += Math.pow(wi[el][riga.classe_eta], 2) * valore ;
        });
        sommatoria = Math.sqrt(sommatoria);
        es[el] = sommatoria / tassi[el];
      }
    );
    return es;
  }
  
  function intervalloTsPrevalenzaGenere(data,anni,sesso = 'Maschi') {
    let tassi = tassoStandardPrevalenzaGenere(data,anni,1, sesso);
    let esLog = calcoloEsLogTsPrevalenzaGenere(data,anni,sesso);
    let container = {};
    let valore = 0;
    let obj = {};
    anni.forEach( el => {
      obj = {
        tasso: 0,
        lcl: 0,
        ucl: 0
      };
      valore = 1.96 * esLog[el];
      obj.lcl = +(Math.exp(Math.log(tassi[el]) - valore) * 1000).toFixed(2);
      obj.ucl = +(Math.exp(Math.log(tassi[el]) + valore) * 1000).toFixed(2);
      obj.tasso = +(tassi[el] * 1000).toFixed(2);
      container[el] = obj;
    });
    return container;
  }
