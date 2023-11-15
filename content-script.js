function run() {
  const init_date_str = "01/01/2026"
  const final_date_str = "14/11/2029"
  const min_amount_to_buy = 49000 //BRL
  const rentab_types = ["CDI", "IPCA", "PRE"]

  const verbose = 1 // 0 > apenas resultados,
                    // 1 > infos gerais,
                    // 2 > info linhas removidas

  function print(message, type = 1) {
    if (type <= verbose)
      console.log(message)
  }

  let started = new Date()
  print(`### [${dateToTime(started)}] Filter-XP: Iniciando Script...`)
  
  const init_date = parseDate(init_date_str)
  const final_date = parseDate(final_date_str)
  
  print('Data inical do período: ' + init_date_str)
  print('Data final do período: ' + final_date_str)
  print('Valor mínimo para aplicar: R$' + min_amount_to_buy)

  const rows = document.querySelectorAll('soma-table-row')
  print(`Total de linhas na página: ${rows.length}`)
  if (rows.length < 2) {
    print('Finalizando script (linhas < 2).')
    return
  }
  
  for (var r=1; r < rows.length; r++) { // row[0] is the table header
    var row = rows[r]
    
    const somaTooltips = row.getElementsByTagName('soma-tooltip')
    const somaTooltip = somaTooltips[0]
    var title = somaTooltip.getAttribute('ariaLabel')
    //console.log(title)

    const row_divs = row.getElementsByTagName('div')

    //console.log("Data de Vencimento:", row_divs[9].innerText)
    let date_str = row_divs[9].innerText
    var date = parseDate(date_str);
    if (date < init_date) {
      print(`removida linha ${r}: vencimento < data mínima`, 2)
      continue
    }
    if (date > final_date) {
      print(`removida linha ${r}: vencimento > data máxima`, 2)
      continue
    }

    //console.log("Rentabilidade:", row_divs[10].innerText)
    let rentab_str = row_divs[10].innerText
    if (rentab_str.search("CDI") && !rentab_types.includes("CDI")) {
      print(`removida linha ${r}: tipo de rendimento não desejado (${rentab_str})`, 2)
      continue
    } else if (rentab_str.search("IPCA") && !rentab_types.includes("IPCA")) {
      print(`removida linha ${r}: tipo de rendimento não desejado (${rentab_str})`, 2)
      continue
    } else {
      if (!rentab_types.includes("PRE")) {
        print(`removida linha ${r}: tipo de rendimento não desejado (${rentab_str})`, 2)
        continue
      }
    }
    var rentab = parseNumber(rentab_str)
    
    //console.log("Apl Minima:", row_divs[16].innerText)
    let min_apl_str = row_divs[16].innerText
    var aux = min_apl_str
    if (aux.endsWith(",00")) {
      aux = aux.substring(0, aux.length-3)
    }
    var min_apl = parseNumber(aux)
  
    var qtd_disp = 0
    let qtd_disp_str
    var qtd_to_buy = 0
    if (min_apl > 0) {
      //console.log("Qtd Disp:", row_divs[17].innerText)
      qtd_disp_str = row_divs[17].innerText
      qtd_disp = parseNumber(qtd_disp_str)
      if (qtd_disp > 0) {
        var asset_max_amout_to_buy = min_apl*qtd_disp
        if (min_amount_to_buy > asset_max_amout_to_buy) {
          print(`removida linha ${r}: minimo à investir (R$${min_amount_to_buy}) > qtd * preço (R$${asset_max_amout_to_buy})`, 2)
          continue
        }
        qtd_to_buy = Math.floor(min_amount_to_buy / min_apl)
      }
    }

    var line_verb = 0
    if (rentab == 0 || min_apl == 0 || qtd_disp == 0) {
      print("Erro na leitura da linha abaixo / ver manualmente:", 1)
      line_verb = 1
    }
    print(r + "ª Linha: " + title +
          " | Data de Vencimento: " + date_str +
          " | Rentabilidade: " + rentab_str +
          " | Apl Minima: " + min_apl_str +
          " | Qtd Disp: " + qtd_disp_str + 
          " | Qtd a se comprar: " + qtd_to_buy,
          line_verb)
  }
  
  let finished = new Date()
  let runtime = finished.getMilliseconds() - started.getMilliseconds()
  print(`### [${dateToTime(finished)}] Filter-XP: Script finalizado em ${runtime}ms.`, 0)
}

run()

function parseDate(date) {
  var parts = date.split("/");
  return new Date(parseInt(parts[2], 10),
                  parseInt(parts[1], 10) - 1,
                  parseInt(parts[0], 10));
}

function parseNumber(number_str) {
  if (typeof number_str == "number") 
    return number_str
  return Number(number_str.replace(/[^0-9-]+/g,""))
}

function dateToTime(d) {
  function format_two_digits(n) {
    return n < 10 ? '0' + n : n;
  }
  hours = format_two_digits(d.getHours());
  minutes = format_two_digits(d.getMinutes());
  seconds = format_two_digits(d.getSeconds());
  return hours + ":" + minutes + ":" + seconds;
}

