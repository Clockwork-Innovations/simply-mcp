## Deploy env matrix

| env         | audience        | freeze window   |
|-------------|-----------------|-----------------|
| staging     | internal only   | none            |
| production  | customers       | Fri 17:00+ UTC  |
| canary      | 1% of prod      | same as prod    |

`deploy` refuses any env not in this list.
