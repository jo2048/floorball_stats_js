import { Season } from "../model/season.js"
import { Player } from "../model/player.js"
import { ChartContainer, fillSelect } from "./display.js"
import { fetchTeamPlayers, searchPlayerByName } from "../model/fetch_player_data.js"

declare const bootstrap: any;

const seasonSelect = document.getElementById("season-select") as HTMLSelectElement
const clubSelect = document.getElementById("club-select") as HTMLSelectElement
const teamSelect = document.getElementById("team-select") as HTMLSelectElement
const searchTeamPlayersButton = document.getElementById("search-team-players-btn") as HTMLButtonElement

const searchPlayerInput = document.getElementById("search-player-input") as HTMLInputElement
const searchPlayerButton = document.getElementById("search-player-button") as HTMLButtonElement

const playersPoolDiv = document.getElementById("players-pool-div") as HTMLDivElement
const unselectAllButton = document.getElementById("player-pool-unselect-all-button") as HTMLButtonElement
const selectAllButton = document.getElementById("player-pool-select-all-button") as HTMLButtonElement
const removeUnselectedButton = document.getElementById("player-pool-remove-unselected-button") as HTMLButtonElement
const createChartButton = document.getElementById("create-chart-button") as HTMLButtonElement
const displayChartButton = document.getElementById("display-chart-button") as HTMLButtonElement

async function initPage(): Promise<void> {
  const sortedSeasons = await Season.getSeasonsSorted()
  
  fillSelect(seasonSelect, sortedSeasons)
  seasonSelect.addEventListener("change", async () => {
    const clubs = await Season.fetchSeasonClubs(parseInt(seasonSelect.value))
    fillSelect(clubSelect, clubs)
    clubSelect.dispatchEvent(new Event("change"))
  })
  
  clubSelect.addEventListener("change", async () => {
    const [_, teams] = await Season.fetchTeamsBySeasonAndClub(parseInt(seasonSelect.value), parseInt(clubSelect.value))
    teams.forEach((t: any) => t.name = `${t.name} (${t.category})`)
    fillSelect(teamSelect, teams)
  })
  
  
  searchTeamPlayersButton.addEventListener("click", async () => {
    const [_ ,data] = await fetchTeamPlayers(parseInt(teamSelect.value))
    const clubName = clubSelect.options[clubSelect.selectedIndex].text
    data.forEach((e: any) => e.clubname = clubName)
    const players = await Promise.all(data.map((e: unknown) => Player.registerPlayer(e)))
    players.forEach(p => addPlayerInPool(p))
  })
  
  seasonSelect.dispatchEvent(new Event("change"))


  searchPlayerInput.addEventListener("change", () => updateSearchPlayerBtn())
  searchPlayerInput.addEventListener("keyup", () => updateSearchPlayerBtn())
  searchPlayerInput.dispatchEvent(new Event("keyup"))

  searchPlayerButton.addEventListener("click", async () => {
    if (searchPlayerInput.checkValidity()) {
      const [_, result] = await searchPlayerByName(searchPlayerInput.value)
      const players = await Promise.all(result.map((data: unknown) => Player.registerPlayer(data)))
      players.forEach(p => addPlayerInPool(p))
    }
  })

  /* ---------------------------------------------------------------------------- */


  unselectAllButton.addEventListener("click", () => {
    playerInPool.forEach((v, k) => {
      changeStatus(v, "not-selected")
    });
    updateCreateChartButton()
  })

  selectAllButton.addEventListener("click", () => {
    playerInPool.forEach((v, k) => {
      changeStatus(v, "selected")
    });
    updateCreateChartButton()
  })

  removeUnselectedButton.addEventListener("click", () => {
    Array.from(playerInPool.entries())
      .filter(([_, v]) => v.getAttribute("status") != "selected")
      .forEach(([k, v]) => {
        v.remove()
        playerInPool.delete(k)
      })
  })

  createChartButton.addEventListener("click", async () => {
    const selectedPlayersIds = getSelectedPlayersIds()

    if (selectedPlayersIds.length > 0 && selectedPlayersIds.length <= 20) {
      createCollapsibleChart(selectedPlayersIds)
    }
  })

  displayChartButton.addEventListener("click", async () => {
    const selectedPlayersIds = getSelectedPlayersIds()

    if (selectedPlayersIds.length > 0 && selectedPlayersIds.length <= 20) {
      const modal = new bootstrap.Modal(document.getElementById('chart-modal'))
      document.getElementById("chart-modal-body").childNodes.forEach(element => {
        element.remove()
      });
      modal.show()
      const selectedPlayers = await Promise.all(selectedPlayersIds.map(async id => await Player.getPlayerById(id)))
      const chartContainer = new ChartContainer(document.getElementById("chart-modal-body"), selectedPlayers);
      
      document.getElementById("chart-modal-label").textContent = selectedPlayersIds.length == 1 ? "Chart - " + chartContainer.title : "Chart"
      await chartContainer.display()
    }
  })


  updateCreateChartButton()
}

async function createCollapsibleChart(playerIds: Array<number>) {
  const selectedPlayers = await Promise.all(playerIds.map(async id => await Player.getPlayerById(id)))

  const details = document.createElement("details")
  const chartContainer = new ChartContainer(details, selectedPlayers);
  details.classList.add("chart-container")
  details.setAttribute("open", "true")
  const chartSummary = document.createElement("summary")
  chartSummary.textContent = chartContainer.title
  details.appendChild(chartSummary)
  document.getElementById("chartsDiv").appendChild(details)
  details.scrollIntoView()
  await chartContainer.display()
  chartContainer.canvas.scrollIntoView()
}

function changeStatus(span: HTMLSpanElement, newStatus: string) {
  span.setAttribute("status", newStatus)
  if (newStatus == "selected") {
    span.classList.remove("text-bg-secondary")
    span.classList.add("text-bg-success")
  } else {
    span.classList.remove("text-bg-success")
    span.classList.add("text-bg-secondary")
  }
}

function createPlayerSpan(player: Player) {
  const span = document.createElement("span")
  span.innerHTML = `${player.name}</br>${player.getAge()} years old</br>${player.clubName}`
  span.setAttribute("class", "badge text-bg-success")
  span.setAttribute("status", "selected")
  span.addEventListener("click", () => {
    const newStatus = span.getAttribute("status") == "selected" ? "not-selected" : "selected"
    changeStatus(span, newStatus)
    updateCreateChartButton()
  })
  return span
}

var playerInPool: Map<number, HTMLSpanElement> = new Map()

function addPlayerInPool(player: Player) {
  if (!playerInPool.has(player.id)) {
    playerInPool.set(player.id, createPlayerSpan(player))
    document.getElementById("selected-players-labels").appendChild(playerInPool.get(player.id))
    updateCreateChartButton()
  }
}

function updateCreateChartButton() {
  const selectedPlayersCount = getSelectedPlayersIds().length
  
  if (selectedPlayersCount > 0 && selectedPlayersCount <= 20) {
    playersPoolDiv.querySelectorAll(".create-chart-btn").forEach(btn => {
      (btn as HTMLButtonElement).disabled = false
      btn.classList.remove("btn-secondary")
      btn.classList.add("btn-success")
    });
    playersPoolDiv.querySelectorAll(".selected-players-badge").forEach(e => {
      e.classList.remove("bg-danger")
      e.classList.add("bg-success")
    });
  }
  else {
    playersPoolDiv.querySelectorAll(".create-chart-btn").forEach(btn => {
      (btn as HTMLButtonElement).disabled = true
      btn.classList.remove("btn-success")
      btn.classList.add("btn-secondary")
    });
    playersPoolDiv.querySelectorAll(".selected-players-badge").forEach(e => {
      e.classList.remove("bg-success")
      e.classList.add("bg-danger")
    });
  }

  playersPoolDiv.querySelectorAll(".selected-players-badge").forEach(e => e.textContent = selectedPlayersCount.toString())
}

function updateSearchPlayerBtn() {  
  searchPlayerInput.classList.remove("border-danger")
  if (!searchPlayerInput.checkValidity()) {
    searchPlayerButton.disabled = true
    searchPlayerButton.classList.remove("btn-success")
    searchPlayerButton.classList.add("btn-secondary")
    if (searchPlayerInput.value) 
      searchPlayerInput.classList.add("border-danger")
  }
  else {
    searchPlayerButton.disabled = false
    searchPlayerButton.classList.remove("btn-secondary")
    searchPlayerButton.classList.add("btn-success")
  }
}

function getSelectedPlayersIds() {
  return Array.from(playerInPool.entries())
    .filter(([_, v]) => v.getAttribute("status") == "selected")
    .map(([k, _]) => k)
}


export { initPage };