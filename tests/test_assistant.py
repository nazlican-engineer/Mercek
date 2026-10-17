import unittest
from pathlib import Path

import pandas as pd

from backend.assistant import answer_question

ROOT = Path(__file__).resolve().parents[1]


class AssistantTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        data = pd.read_csv(ROOT / "data/processed/MFG10YearTerminationData_clean.csv")
        cls.exits = data[data["STATUS"] == "TERMINATED"].copy()
        cls.exits["exit_date"] = pd.to_datetime(cls.exits["terminationdate_key"])

    def ask(self, question):
        return answer_question(question, ROOT / "data/processed/warehouse.duckdb")

    def test_wording_variations(self):
        for question in ["2014 yılında kaç çalışan ayrıldı?", "2014’te ayrılan kişi sayısı ne?", "2014 toplam ayrılma sayısını göster"]:
            with self.subTest(question=question):
                self.assertEqual(self.ask(question)["count"], 253)

    def test_combined_filters_match_csv(self):
        expected = self.exits[(self.exits.exit_date.dt.year == 2015) & (self.exits.department_name == "Meats") & (self.exits.termreason_desc == "Resignation")]
        result = self.ask("2015’te Meats departmanından istifa edenleri listele")
        self.assertEqual({row[0] for row in result["rows"]}, set(expected.EmployeeID))

    def test_store_excludes_head_office(self):
        expected = self.exits[(self.exits.store_name == 35) & (self.exits.BUSINESS_UNIT == "STORES")]
        result = self.ask("35 numaralı mağazadan kimler ayrıldı?")
        self.assertEqual({row[0] for row in result["rows"]}, set(expected.EmployeeID))
        self.assertTrue(all(row[4] == "Mağaza 35" for row in result["rows"]))

    def test_city_and_tenure(self):
        for question, expected in [
            ("Vancouver’da emeklilik nedeniyle ayrılanlar kimler?", self.exits[(self.exits.city_name == "Vancouver") & (self.exits.termreason_desc == "Retirement")]),
            ("İlk iki yılında istifa eden çalışanları getir", self.exits[(self.exits.length_of_service <= 2) & (self.exits.termreason_desc == "Resignation")]),
        ]:
            with self.subTest(question=question):
                self.assertEqual({row[0] for row in self.ask(question)["rows"]}, set(expected.EmployeeID))

    def test_months_and_exact_dates(self):
        expected = self.exits[self.exits.exit_date.between("2014-01-01", "2014-03-31")].EmployeeID.nunique()
        for question in ["Ocak–Mart 2014 arasında kaç kişi ayrıldı?", "01.01.2014 ile 31.03.2014 arasında kaç kişi ayrıldı?", "2014-01-01 ile 2014-03-31 arasında kaç kişi ayrıldı?"]:
            self.assertEqual(self.ask(question)["count"], expected)

    def test_groups_comparison_and_employee(self):
        self.assertEqual(self.ask("2014 ve 2015 ayrılma sayılarını karşılaştır")["rows"], [[2014, 253], [2015, 162]])
        result = self.ask("En çok istifa görülen beş departmanı göster")
        expected = self.exits[self.exits.termreason_desc == "Resignation"].groupby("department_name").size().to_dict()
        self.assertEqual(len(result["rows"]), 5)
        for label, count in result["rows"]:
            self.assertEqual(count, expected[label])
        employee = self.ask("3008 numaralı çalışanın ayrılma bilgisi nedir?")
        self.assertEqual(employee["rows"][0][0], 3008)
        self.assertEqual(sum(row[1] for row in self.ask("2014 yılında ayrılma sebeplerini göster")["rows"]), 253)

    def test_unsupported_or_ambiguous_questions(self):
        for question in ["merhaba", "2016’da kaç kişi ayrıldı?", "Ankara’da kaç kişi ayrıldı?", "XYZ departmanından kaç kişi ayrıldı?", "2014 yılında ayrılmayanları listele", "2014 yılında kaç kadın ayrıldı?", "Mart–Ocak 2014 arasında kaç kişi ayrıldı?", "31.02.2014 tarihinde kaç kişi ayrıldı?", "Gelecek ay kim ayrılacak?", "En çok ayrılma nerede?", "2014 ve 2015 Ocak ayında kaç kişi ayrıldı?"]:
            with self.subTest(question=question):
                self.assertFalse(self.ask(question)["supported"])


if __name__ == "__main__":
    unittest.main()
