const initialDate = document.getElementById('initial-date');
const finalDate = document.getElementById('final-date');
const investAmout = document.getElementById('invest-amount');
const runBtn = document.getElementById('run-btn');

chrome.storage.local.get(["init_date"]).then((result) => {
  if (result.init_date)
    initialDate.value = result.init_date
});
chrome.storage.local.get(["final_date"]).then((result) => {
  if (result.final_date)
    finalDate.value = result.final_date
});
chrome.storage.local.get(["invest_amount"]).then((result) => {
  if (result.invest_amount)
    investAmout.value = result.invest_amount
});

async function getCurrentTab() {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

runBtn.addEventListener('click', async () => {
  const tab = await getCurrentTab();

  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: RunFilter,
    args: [initialDate.value, finalDate.value, investAmout.value]
  });
});

function RunFilter(init_date_str, final_date_str, invest_amount) {
  console.log(`### [${dateToTime(new Date())}] Filter-XP: Script iniciado:`)

  const cdi = 12.15
  const ipca = 4.82

  chrome.storage.local.set({ 'init_date': init_date_str });
  chrome.storage.local.set({ 'final_date': final_date_str });
  chrome.storage.local.set({ 'invest_amount': invest_amount });

  if (init_date_str == "") {
    console.log("'Data inicial' não pode ser vazia.")
    console.log('Script Finalizado.')
    return
  }
  if (isDate(init_date_str)) {
    console.log('Data inicial: ' + init_date_str)
  } else {
    console.log('Data inicial inválida: ' + init_date_str)
    console.log('Script Finalizado.')
    return
  }

  if (final_date_str == "") {
    console.log("'Data final' não pode ser vazia.")
    console.log('Script Finalizado.')
    return
  } 
  if (isDate(final_date_str)) {
    console.log('Data final: ' + final_date_str)
  } else {
    console.log('Data final inválida: ' + final_date_str)
    console.log('Script Finalizado.')
    return
  }

  if (invest_amount == "") {
    console.log("'Valor a investir' não pode ser vazio.")
    console.log('Script Finalizado.')
    return
  }
  let num = parseNumber(invest_amount)
  if (!num) {
    console.log("'Valor a investir' inválido: " + invest_amount)
    console.log("Campo deve ser preenchido com um número sem 'R$' antes.")
    console.log('Script Finalizado.')
    return
  }
  invest_amount = num
  console.log('Valor a investir: R$' + invest_amount)

  const init_date = parseDate(init_date_str)
  const final_date = parseDate(final_date_str)

  const rows = document.querySelectorAll('soma-table-row')
  if (!rows || rows.length < 2) {
    console.log('Script finalizado: linhas não encontradas ou menor que 2.')
    return
  }
  console.log(`Total de linhas na página: ${rows.length-1}`)
  
  let debug_row
  const due_date_possible_cols = [7, 8, 9, 10]
  for (var r=1; r < rows.length; r++) { // row[0] is the table header
    var row = rows[r]
    
    const somaTooltips = row.getElementsByTagName('soma-tooltip')
    const somaTooltip = somaTooltips[0]
    var title = somaTooltip.getAttribute('ariaLabel')

    const spans = somaTooltip.getElementsByTagName('span')
    let span = spans[0]
    let span_txt = span.innerText
    const somaBtns = row.getElementsByTagName('soma-button')
    let somaBtn = somaBtns[0]
    let btn_txt = somaBtn.innerText
    function SetRowBuyable() {
      span.innerHTML = `<b>${span_txt}</b>`
      somaBtn.innerHTML = `<b>${btn_txt}</b>`
      somaBtn.style.color = "LimeGreen";
    }
    function SetRowNotBuyable() {
      span.innerHTML = `<s>${span_txt}</s>`
      somaBtn.innerHTML = `<s>${btn_txt}</s>`
      somaBtn.style.color = "Brown";
    }
    
    let due_date_str
    let rentabil_str
    let min_apl_str
    let qtd_disp_str
    const row_divs = row.getElementsByTagName('div')
    for (var p=0; p<due_date_possible_cols.length; p++) {
      var due_date_col = due_date_possible_cols[p]
      var rentabil_col = due_date_col + 1
      var min_apli_col = due_date_col + 7
      var qnt_avai_col = min_apli_col + 1

      due_date_str = row_divs[due_date_col].innerText
      rentabil_str = row_divs[rentabil_col].innerText
      min_apl_str = row_divs[min_apli_col].innerText
      qtd_disp_str = row_divs[qnt_avai_col].innerText

      let is_date_valid = (due_date_str != "" && isDate(due_date_str))
      let is_min_apl_valid = (min_apl_str != "") && min_apl_str.startsWith("R$")

      if (debug_row && debug_row == r) {
        console.log("p", p)
        console.log("due_date_str", due_date_str)
        console.log("isDate", isDate(due_date_str))
        console.log("is_date_valid", is_date_valid)
        console.log("min_apl_str", min_apl_str)
        console.log("is_min_apl_valid", is_min_apl_valid)
        console.log("qtd_disp_str", qtd_disp_str)
        console.log("--------------------------")
      }

      if (is_date_valid && is_min_apl_valid && qtd_disp_str != "")
        break;
    }

    if (due_date_str == "" || !isDate(due_date_str) ||
        min_apl_str == "" || !min_apl_str.startsWith("R$") ||
        qtd_disp_str == "")
    {
      console.log(r + "ª linha descartada: não foi lida corretamente, ver manualmente | Ativo: " + title)
      continue
    }

    var date = parseDate(due_date_str);
    if (date < init_date) {
      console.log(`${r}ª linha descartada: vencimento ${due_date_str} < data mínima ${init_date_str}`)
      SetRowNotBuyable()
      continue
    }
    if (date > final_date) {
      console.log(`${r}ª linha descartada: vencimento ${due_date_str} > data máxima ${final_date_str}`)
      SetRowNotBuyable()
      continue
    }
    
    var min_apl = parseNumber(min_apl_str)
    if (debug_row && debug_row == r) {
      console.log("min_apl", min_apl)
    }
    if (min_apl > invest_amount) {
      console.log(`${r}ª linha descartada: aplicação mínima (R$${min_apl.toFixed(2)}) > valor a investir (R$${invest_amount})`)
      SetRowNotBuyable()
      continue
    }

    var qtd_disp = 0
    var qtd_to_buy = 0
    if (min_apl > 0) {
      qtd_disp = parseNumber(qtd_disp_str)
      if (qtd_disp > 0) {
        var asset_max_amout_to_buy = min_apl*qtd_disp
        if (invest_amount > asset_max_amout_to_buy) {
          console.log(`${r}ª linha descartada: minimo a investir (R$${invest_amount}) > qtd * preço (R$${asset_max_amout_to_buy.toFixed(2)})`)
          SetRowNotBuyable()
          continue
        }
        qtd_to_buy = Math.floor(invest_amount / min_apl)
      }
    }

    if (min_apl == 0 || qtd_disp == 0) {
      console.log(r + "ª linha não foi lida corretamente, ver manualmente [2] | Ativo: " + title)
    }
    else {
      let rentab_equiv_pre = parseRentability(rentabil_str)
      console.log(r + "ª linha válida! " + rentab_equiv_pre + "Qtd: " + qtd_to_buy + " | Ativo: " + title)
      SetRowBuyable()
    }
  } // for (var r=1; r < rows.length; r++)
  
  console.log(`### [${dateToTime(new Date())}] Filter-XP: Script finalizado.`)

  //
  // auxiliary functions:
  //
  function isDate(date) {
    if (!date || date == "")
      return false
    var date_regex = /^\d{2}\/\d{2}\/\d{4}$/
    return date_regex.test(date)
  }

  function parseDate(date) {
    var parts = date.split("/");
    return new Date(parseInt(parts[2], 10),
                    parseInt(parts[1], 10) - 1,
                    parseInt(parts[0], 10));
  }

  function parseNumber(number_str) {
    if (typeof number_str == "number") 
      return number_str

    if (number_str.search(/\./))
      number_str = number_str.replace(/\./, '')

    if (number_str.search(','))
      number_str = number_str.replace(',', '.')

    return Number(number_str.replace(/[^0-9.-]+/g,""))
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

  function parseRentability(rentabil_str) {
    if (!rentabil_str || rentabil_str === "") 
      return ""

    const perc_cdi = rentabil_str.search("% CDI")
    if (perc_cdi) {
      let aux = rentabil_str.substring(0, perc_cdi)
      let rentab_num = parseNumber(aux)
      if (rentab_num) {
        rentab_num = (rentab_num/100)*cdi
        return "Rent. equiv.: " + rentab_num.toFixed(2).toString() + "% | "
      }
    }

    const is_ipca = rentabil_str.startsWith("IPC-A +")
    if (is_ipca) {
      let aux = rentabil_str.substring(7, rentabil_str.length-2)
      if (aux) {
        let rentab_num = parseNumber(aux)
        if (rentab_num) {
          rentab_num = rentab_num + ipca
          return "Rent. equiv.: " + rentab_num.toFixed(2).toString() + "% | "
        }
      }
    }

    const is_cdi_plus = rentabil_str.startsWith("CDI +")
    if (is_cdi_plus) {
      let aux = rentabil_str.substring(5, rentabil_str.length-2)
      if (aux) {
        let rentab_num = parseNumber(aux)
        if (rentab_num) {
          rentab_num = rentab_num + cdi
          return "Rent. equiv.: " + rentab_num.toFixed(2).toString() + "% | "
        }
      }
    }
    return "Rent.: " + rentabil_str + " | "
  }
}

