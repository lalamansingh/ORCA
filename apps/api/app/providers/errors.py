class ProviderError(Exception):
    """Base error for sanitized provider failures."""


class ProviderUnavailableError(ProviderError):
    pass


class ProviderTimeoutError(ProviderError):
    pass


class ProviderResponseError(ProviderError):
    pass


class ProviderRateLimitError(ProviderError):
    pass


class DataUnavailableError(ProviderError):
    pass
