"""Small deterministic scoring primitives with explicit overlap handling."""

from math import prod


def overlap_capped_score(scores: list[int], cap: int, discount: float) -> tuple[int, list[int]]:
    """Keep the strongest signal and discount correlated signals in one group."""
    if not scores:
        return 0, []
    indexed = sorted(enumerate(scores), key=lambda item: (-item[1], item[0]))
    allocations = [0] * len(scores)
    remaining = cap
    for position, (original_index, score) in enumerate(indexed):
        candidate = score if position == 0 else round(score * discount)
        applied = min(max(candidate, 0), remaining)
        allocations[original_index] = applied
        remaining -= applied
        if remaining == 0:
            break
    return sum(allocations), allocations


def diminishing_union(scores: list[int]) -> int:
    """Combine independent hazard groups without naive linear addition."""
    bounded = [min(100, max(0, score)) for score in scores if score > 0]
    if not bounded:
        return 0
    return min(100, max(0, round(100 * (1 - prod(1 - score / 100 for score in bounded)))))


def marginal_group_contributions(scores: list[int]) -> list[int]:
    """Expose each group's deterministic marginal contribution to the final score."""
    contributions: list[int] = []
    total = 0
    for score in scores:
        updated = diminishing_union([total, score])
        contributions.append(updated - total)
        total = updated
    return contributions


def proportional_integer_allocation(total: int, weights: list[int]) -> list[int]:
    if total <= 0 or not weights or sum(weights) <= 0:
        return [0] * len(weights)
    raw = [total * weight / sum(weights) for weight in weights]
    result = [int(value) for value in raw]
    remainder = total - sum(result)
    order = sorted(range(len(raw)), key=lambda index: (-(raw[index] - result[index]), index))
    for index in order[:remainder]:
        result[index] += 1
    return result
