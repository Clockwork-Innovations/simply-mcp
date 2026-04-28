# analyze.py — example Python handler for Simply-MCP.
#
# Globals injected by the bridge:
#   ARGS         dict of tool parameters (Buffer/Uint8Array values arrive as bytes)
#   RETURN(v)    return a JSON-serializable value; ends the run
#   RETURN_BYTES(b)
#                return raw bytes (b: bytes/bytearray/memoryview); ends the run
#
# Raise any Python exception to surface a structured PythonHandlerError on
# the TS side — the type, message, traceback, and optional `.payload`
# attribute are preserved.

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
