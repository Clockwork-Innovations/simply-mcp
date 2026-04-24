# analyze.py - Example Python handler for Simply-MCP
#
# ARGS: dict containing tool parameters (from JSON)
# RETURN(value): function to return result (will be JSON serialized)
#
# This script is called by the PythonHandlerResolver when a tool
# with handler: { type: 'python', script: './handlers/analyze.py' } is invoked.

data = ARGS.get("data", [])
algorithm = ARGS.get("algorithm", "basic")

if not data:
    RETURN({"error": "No data provided", "algorithm": algorithm})

# Basic statistics
result = {
    "algorithm": algorithm,
    "count": len(data),
    "sum": sum(data),
    "min": min(data),
    "max": max(data),
    "mean": sum(data) / len(data),
}

# Extended analysis
if algorithm == "extended":
    sorted_data = sorted(data)
    n = len(data)

    # Median
    if n % 2 == 0:
        median = (sorted_data[n // 2 - 1] + sorted_data[n // 2]) / 2
    else:
        median = sorted_data[n // 2]

    # Variance and standard deviation
    mean = result["mean"]
    variance = sum((x - mean) ** 2 for x in data) / n
    std_dev = variance ** 0.5

    result.update({
        "median": median,
        "variance": round(variance, 4),
        "std_dev": round(std_dev, 4),
        "range": result["max"] - result["min"],
    })

RETURN(result)
