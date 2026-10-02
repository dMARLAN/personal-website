from dataclasses import dataclass

from services.auth.throttle import LoginThrottle


@dataclass
class FakeClock:
    now: float = 1000.0

    def __call__(self) -> float:
        return self.now


def fail(throttle: LoginThrottle, client: str, times: int) -> None:
    for _ in range(times):
        throttle.record_failure(client)


def test_four_failures_still_allow_a_try() -> None:
    throttle = LoginThrottle(FakeClock())
    fail(throttle, "1.2.3.4", 4)

    assert throttle.retry_after("1.2.3.4") is None


def test_five_failures_lock_the_client_for_the_rest_of_the_window() -> None:
    # Arrange
    clock = FakeClock()
    throttle = LoginThrottle(clock)
    fail(throttle, "1.2.3.4", 5)

    # Act
    clock.now += 60

    # Assert
    assert throttle.retry_after("1.2.3.4") == 15 * 60 - 60


def test_the_lock_lifts_once_the_failures_age_out() -> None:
    clock = FakeClock()
    throttle = LoginThrottle(clock)
    fail(throttle, "1.2.3.4", 5)

    clock.now += 15 * 60

    assert throttle.retry_after("1.2.3.4") is None


def test_clients_are_counted_separately() -> None:
    throttle = LoginThrottle(FakeClock())
    fail(throttle, "1.2.3.4", 5)

    assert throttle.retry_after("5.6.7.8") is None


def test_reset_clears_the_failures() -> None:
    throttle = LoginThrottle(FakeClock())
    fail(throttle, "1.2.3.4", 5)

    throttle.reset("1.2.3.4")

    assert throttle.retry_after("1.2.3.4") is None
