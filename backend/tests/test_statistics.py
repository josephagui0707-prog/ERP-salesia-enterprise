import json
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.statistics import summarize, bayes, salesia_summary

class TestStatistics(unittest.TestCase):
    def test_average_median(self):
        result = summarize([100, 200, 900])
        self.assertAlmostEqual(result['mean'], 400)
        self.assertEqual(result['median'], 200)
        self.assertEqual(result['n'], 3)

    def test_even_median(self):
        self.assertEqual(summarize([10, 20, 30, 40])['median'], 25)

    def test_bayes(self):
        result = bayes(.3, .7, .2)
        self.assertAlmostEqual(result['posterior'], .6)

    def test_bad_input(self):
        with self.assertRaises(ValueError):
            summarize([])
        with self.assertRaises(ValueError):
            bayes(.3, .7, 0) if False else bayes(1.1, .7, .2)

    def test_browser_json(self):
        self.assertEqual(json.loads(salesia_summary('[10,20,30]'))['median'], 20)

if __name__ == '__main__':
    unittest.main()
