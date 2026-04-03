from datetime import datetime

def calculate_priority(task):
    deadline = datetime.strptime(task["deadline"], "%Y-%m-%d %H:%M:%S")
    now = datetime.now()

    time_remaining = (deadline - now).total_seconds()

    if time_remaining <= 0:
        return 9999  # overdue → highest priority

    return (task["importance"] / time_remaining) * 100000