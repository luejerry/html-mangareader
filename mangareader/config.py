from configparser import ConfigParser
from os import makedirs, path
import appdirs

CONFIG_KEY = 'mangareader'


def get_or_create_config() -> ConfigParser:
    r"""
    Get the config file, creating it if it does not exist. The config file is created under
    the user's app data directory.

    Examples:
        Windows 10: `C:\Users\username\AppData\Local\html-mangareader\config.ini`
        MacOS: `/Users/username/Library/Application Support/html-mangareader/config.ini`
    """
    config = ConfigParser()
    setattr(config, 'optionxform', lambda x: x)  # preserve case of keys

    # create the config path if it doesn't exist
    user_path = appdirs.user_data_dir('html-mangareader', appauthor=False)
    makedirs(user_path, exist_ok=True)
    config_path = path.join(user_path, 'config.ini')

    config.read(config_path)

    dirty = False
    if not CONFIG_KEY in config:
        config[CONFIG_KEY] = {}
        dirty = True
    if not 'browser' in config[CONFIG_KEY]:
        config[CONFIG_KEY]['browser'] = ''
        dirty = True
    if not 'disableNavButtons' in config[CONFIG_KEY]:
        config[CONFIG_KEY]['disableNavButtons'] = 'no'
        dirty = True
    if not 'dynamicImageLoading' in config[CONFIG_KEY]:
        config[CONFIG_KEY]['dynamicImageLoading'] = 'no'
        dirty = True
    if dirty:
        with open(config_path, 'w') as config_file:
            config.write(config_file)
    return config
