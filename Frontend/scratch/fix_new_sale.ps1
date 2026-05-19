$file = "components/new-sale.tsx"
$lines = Get-Content $file
$start = 2018 # The line number of </div>
$end = 2038   # The line number of the end of the corrupted block

$replacement = @"
                    </div>

                    <div className="mt-3 rounded-lg border border-gray-100 bg-slate-50 p-3 space-y-3">
                      {/* Price editor */}
                      <div>
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold tracking-wide text-gray-600">
                            Selling Price (Rs)
                          </label>
                          {isPriceOverridden(item) && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-[11px] text-amber-700 hover:text-amber-800"
                              onClick={() => {
                                setCart(
                                  cart.map((cartItem) =>
                                    cartItem.id === item.id
                                      ? {
                                          ...cartItem,
                                          actualUnitPrice: cartItem.originalPrice,
                                          price: cartItem.originalPrice,
                                        }
                                      : cartItem,
                                  ),
                                );
                              }}
                            >
                              Reset Default
                            </Button>
                          )}
                        </div>
"@

$newContent = ($lines[0..($start-1)] -join "`r`n") + "`r`n" + $replacement + "`r`n" + ($lines[$end..($lines.Count-1)] -join "`r`n")
[System.IO.File]::WriteAllText((Get-Item $file).FullName, $newContent)
