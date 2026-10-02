from dependency_injector import containers, providers

from config import Config


class Container(containers.DeclarativeContainer):
    wiring_config = containers.WiringConfiguration(modules=["routes.health"])

    config: providers.Singleton[Config] = providers.Singleton(Config)
