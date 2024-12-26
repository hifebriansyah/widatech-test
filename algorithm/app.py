# yes i know, basically this is very brute force approach, but it's work hehe..

from itertools import combinations

def nonRepeat(l, t):
    all_combinations = combinations(range(1, 10), l)
    valid_combinations = [list(comb) for comb in all_combinations if sum(comb) == t]
    return valid_combinations

print(nonRepeat(3, 6))
print(nonRepeat(3, 8))
print(nonRepeat(4, 5))
