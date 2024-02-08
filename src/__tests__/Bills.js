/**
 * @jest-environment jsdom
 */

import {fireEvent, screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js"
import { bills } from "../fixtures/bills.js"
import {ROUTES, ROUTES_PATH} from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";
import store from "../__mocks__/store.js";
import mockStore from "../__mocks__/store"

import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      //to-do write expect expression
      expect(windowIcon.classList.contains('active-icon')).toBeTruthy()
    })
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    test("Then click on the New Bill button should redirect to New Bill page", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const billsContainer = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage
      })
      const handleClickNewBill = jest.fn(billsContainer.handleClickNewBill)
      const newBillBtn = screen.getByTestId('btn-new-bill')
      newBillBtn.addEventListener('click', handleClickNewBill)
      fireEvent.click(newBillBtn)
      expect(screen.getAllByText('Envoyer une note de frais')).toBeTruthy()
    })
    test("Then click on the eye icon should open a modal", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      const newBillBtn = screen.getByTestId('btn-new-bill')
      fireEvent.click(newBillBtn)
      const billsContainer = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage
      })
      $.fn.modal = jest.fn()
      const handleClickIconEye = jest.fn(billsContainer.handleClickIconEye)
      const iconEye = screen.getAllByTestId('icon-eye')[0]
      iconEye.addEventListener('click', handleClickIconEye(iconEye))
      fireEvent.click(iconEye)
      expect(handleClickIconEye).toHaveBeenCalled()
      expect($.fn.modal).toHaveBeenCalled()
    })
    test("Then getBills should return an array of bills", async () => {
      const billsContainer = new Bills({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage
      })
      billsContainer.getBills = jest.fn(billsContainer.getBills);
      const bills = await billsContainer.getBills();
      expect(billsContainer.getBills).toHaveBeenCalledTimes(1);
    })
  })
})

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills", () => {
    test("Then fetches bills from API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ type: "Employee", email: "e@e" }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByText("Mes notes de frais"))
      const content = await screen.getByTestId("tbody")
      expect(content).toBeTruthy()
    })
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
          window,
          'localStorage',
          { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee',
          email: "e@e"
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })
      test("Then fetches bills from an API and fails with 404 message error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 404"))
            }
          }})
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })

      test("Then fetches messages from an API and fails with 500 message error", async () => {

        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 500"))
            }
          }})

        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})
