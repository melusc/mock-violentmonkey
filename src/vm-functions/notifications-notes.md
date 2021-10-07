# Notification Inconsistencies

Tested on Windows 10/11 with Firefox@94, MS Edge@96, and Chrome@96.

Firefox uses its own implementation for notifications.

Chromium uses the built-in notifications of the OS.

## Clicking the notification

Firefox:

1. Calls `onclick`
1. Plays fadeout animation (~600ms)
1. Calls `ondone`

Chromium:

1. Calls `onclick`

## Letting the notification timeout

Firefox:

1. Times out after 20s
1. Calls `ondone`

Chromium:

- Doesn't timeout

## Closing the notification

Firefox:

1. Calls `ondone`

Chromium:

- Nothing

## Removing the notification

Both behave the same:
Both remove the notification and don't call any event listener.
