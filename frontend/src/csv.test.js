import test from 'node:test'
import assert from 'node:assert/strict'
import { csvCell } from './csv.js'

test('CSV metnindeki formüller etkisizleştirilir', () => {
  for (const value of ['=1+1', '+SUM(A1)', '-1+2', '@SUM(A1)', '  =1+1', '\t=1+1']) {
    assert.ok(csvCell(value).startsWith('"\''))
  }
})

test('CSV tırnakları, Türkçe, boş hücreler ve sayılar korunur', () => {
  assert.equal(csvCell('İş "A"; ekip'), '"İş ""A""; ekip"')
  assert.equal(csvCell(null), '""')
  assert.equal(csvCell(138), '"138"')
  assert.equal(csvCell(-2), '"-2"')
})
