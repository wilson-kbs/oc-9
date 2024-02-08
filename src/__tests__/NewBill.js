/**
 * @jest-environment jsdom
 */

import {fireEvent, screen, waitFor} from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {localStorageMock} from "../__mocks__/localStorage.js"
import {ROUTES} from "../constants/routes.js"


import store from "../__mocks__/store.js";
import mockStore from "../__mocks__/store"

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then it should load NewBill page", () => {
      document.body.innerHTML = NewBillUI()
      expect(screen.getAllByText("Envoyer une note de frais")).toBeTruthy()
    })

    test("Then it should call handleChangeFile when file input value changes", () => {
      document.body.innerHTML = NewBillUI()
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const newBill = new NewBill({
        document, onNavigate, store, localStorage
      })

      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      const fileElement = screen.getByTestId('file')
      fileElement.addEventListener('change', handleChangeFile)
      fireEvent.change(fileElement, {
        target: {
          files: [new File(['(⌐□_□)'], 'chucknorris.png', {type: 'image/png'})],
        },
      })
      expect(handleChangeFile).toHaveBeenCalled()
    })

    test("Then it should call handleSubmit when form is submitted", () => {
      document.body.innerHTML = NewBillUI()
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const newBill = new NewBill({
        document, onNavigate, store, localStorage
      })

      const handleSubmit = jest.fn(newBill.handleSubmit)
      const formNewBill = screen.getByTestId('form-new-bill')
      formNewBill.addEventListener('submit', handleSubmit)
      fireEvent.submit(formNewBill)
      expect(handleSubmit).toHaveBeenCalled()
    })

    test("Then it should call updateBill when handleSubmit is called", async () => {
      document.body.innerHTML = NewBillUI()
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))

      const newBill = new NewBill({
        document, onNavigate, store, localStorage
      })

      const handleSubmit = jest.fn(newBill.handleSubmit)
      const form = screen.getByTestId('form-new-bill')

      const file = new File(['(⌐□_□)'], 'chucknorris.png', {type: 'image/png'})
      await waitFor(() => {
        userEvent.upload(screen.getByTestId('file'), file)
      })

      form.addEventListener("submit", handleSubmit);
      fireEvent.submit(form)

      expect(screen.getByTestId('btn-new-bill')).toBeTruthy()
      expect(newBill.fileUrl).toBe('https://localhost:3456/images/test.jpg')
      expect(newBill.fileName).toBe('')
      expect(newBill.billId).toBe('1234')
    })
  })
})

// test d'intégration POST
describe("Given I am a user connected as Employee", () => {
  describe("When I create a new bill", () => {
    test("Then it should add the bill to the store", async () => {
      const sleep = (ms) => {
        return new Promise(resolve => setTimeout(resolve, ms));
      }
      const newBillId = "1234";
      const newBill = {
        email: 'e@e',
        type: 'Restaurants et bars',
        name: 'test bill',
        amount: 200,
        date: '2002-02-05',
        vat: '40',
        pct: 20,
        commentary: 'test commentary',
        fileUrl: 'https://localhost:3456/images/test.jpg',
        fileName: '',
        status: 'pending',
      }

      document.body.innerHTML = NewBillUI()
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: newBill.email
      }))

      new NewBill({
        document,
        onNavigate,
        store,
        localStorage: window.localStorage
      })


      const billsSpy = jest.spyOn(store, 'bills').mockReturnValue({
        update: jest.fn(store.bills().update),
        create: jest.fn(store.bills().create),
      })

      screen.getByTestId('expense-type').value = newBill.type
      screen.getByTestId('expense-name').value = newBill.name
      screen.getByTestId('datepicker').value = newBill.date
      screen.getByTestId('amount').value = newBill.amount
      screen.getByTestId('vat').value = newBill.vat
      screen.getByTestId('pct').value = newBill.pct
      screen.getByTestId('commentary').value = newBill.commentary

      const file = new File(['(⌐□_□)'], newBill.fileName, {type: 'image/png'})
      await waitFor(() => {
        userEvent.upload(screen.getByTestId('file'), file)
      })

      const form = screen.getByTestId('form-new-bill')
      fireEvent.submit(form)
      const updateSpy = jest.spyOn(billsSpy.mock.results.at(-1).value, 'update')

      // console.log(billsSpy.mock.results[2].value.update.mock.calls)

      expect(updateSpy).toHaveBeenCalledTimes(1)
      expect(updateSpy).toHaveBeenCalledWith({
        data: JSON.stringify(newBill),
        selector: newBillId,
      })
    })
  })
})
