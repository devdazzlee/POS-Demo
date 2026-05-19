$file = "components/new-sale.tsx"
$lines = Get-Content $file
# Remove line 2019 (index 2018) which is the extra </div>
$newContent = ($lines[0..2017] -join "`r`n") + "`r`n" + ($lines[2019..($lines.Count-1)] -join "`r`n")
[System.IO.File]::WriteAllText((Get-Item $file).FullName, $newContent)
