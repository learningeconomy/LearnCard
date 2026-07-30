import React from 'react';

/**
 * Data Sharing tile icon — exported from Figma (LC-1928, node 2344:79819).
 * Self-contained: layer SVGs are inlined as base64 data URIs (no localhost/asset-server dep).
 * Designed to fill a square parent (root is `size-full`).
 */
const DataSharingTileIcon: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`relative size-full ${className ?? ''}`} aria-hidden="true">
        <div className="absolute inset-[14.97%_2.88%_19.03%_1.12%]">
            <img
                alt=""
                className="absolute block inset-0 max-w-none size-full"
                src="data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgdmlld0JveD0iMCAwIDk2IDY2IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBpZD0iVmVjdG9yIiBkPSJNNzQuMzk4MSA2NkgzMy41OTQ0QzI3LjM2MjggNjUuOTk4NCAyMS4yNTQ0IDY0LjI5NTEgMTUuOTUxNyA2MS4wODA1QzEwLjY0OTEgNTcuODY1OCA2LjM2MTE4IDUzLjI2NjUgMy41NjcwOSA0Ny43OTYzQzAuNzczMDA3IDQyLjMyNjIgLTAuNDE3MTUzIDM2LjIwMDggMC4xMjk2MDkgMzAuMTA0NkMwLjY3NjM3MSAyNC4wMDg0IDIuOTM4NTEgMTguMTgxNiA2LjY2MzI2IDEzLjI3NTNDMTAuMzg4IDguMzY5MDcgMTUuNDI4NiA0LjU3NjYgMjEuMjIxOCAyLjMyMTczQzI3LjAxNSAwLjA2Njg1MTkgMzMuMzMyNSAtMC41NjE1OTEgMzkuNDY4NSAwLjUwNjYyMUM0NS42MDQ0IDEuNTc0ODMgNTEuMzE3IDQuMjk3NjIgNTUuOTY3OSA4LjM3MDcxQzYwLjYxODggMTIuNDQzOCA2NC4wMjQ4IDE3LjcwNjggNjUuODA1MyAyMy41NzE0SDc0LjM5ODFDODAuMTI3MyAyMy41NzE0IDg1LjYyMTggMjUuODA2NSA4OS42NzI5IDI5Ljc4NUM5My43MjQxIDMzLjc2MzQgOTYgMzkuMTU5MyA5NiA0NC43ODU3Qzk2IDUwLjQxMjEgOTMuNzI0MSA1NS44MDggODkuNjcyOSA1OS43ODY1Qzg1LjYyMTggNjMuNzY0OSA4MC4xMjczIDY2IDc0LjM5ODEgNjZaIiBmaWxsPSJ2YXIoLS1maWxsLTAsICNGQUNDMTUpIi8+Cjwvc3ZnPgo="
            />
        </div>
        <div className="absolute inset-[6%_21.75%_7.27%_20.77%]">
            <div className="absolute inset-[-1.73%_-2.61%]">
                <img
                    alt=""
                    className="block max-w-none size-full"
                    src="data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgdmlld0JveD0iMCAwIDYwLjQ4NyA4OS43MzQ2IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZyBpZD0iR3JvdXAgMjY3MSI+CjxwYXRoIGlkPSJWZWN0b3IiIGQ9Ik01MC4zNjM2IDI4LjMyODRIMzQuMDc1QzMxLjU4NzMgMjguMzI3NyAyOS4xNDg5IDI3LjYzNTMgMjcuMDMyMSAyNi4zMjg2QzI0LjkxNTMgMjUuMDIxOSAyMy4yMDM2IDIzLjE1MjMgMjIuMDg4MiAyMC45Mjg3QzIwLjk3MjggMTguNzA1MiAyMC40OTc3IDE2LjIxNTMgMjAuNzE2IDEzLjczNzJDMjAuOTM0MiAxMS4yNTkyIDIxLjgzNzMgOC44OTA2NSAyMy4zMjQyIDYuODk2M0MyNC44MTExIDQuOTAxOTUgMjYuODIzMyAzLjM2MDM0IDI5LjEzNTkgMi40NDM3NkMzMS40NDg1IDEuNTI3MTggMzMuOTcwNCAxLjI3MTcyIDM2LjQxOTkgMS43MDU5NEMzOC44NjkzIDIuMTQwMTUgNDEuMTQ5OCAzLjI0Njk0IDQzLjAwNjQgNC45MDI2MUM0NC44NjMgNi41NTgyOSA0Ni4yMjI3IDguNjk3NjIgNDYuOTMzNCAxMS4wODE2SDUwLjM2MzZDNTIuNjUwNyAxMS4wODE2IDU0Ljg0NDEgMTEuOTkwMSA1Ni40NjEzIDEzLjYwNzNDNTguMDc4NSAxNS4yMjQ1IDU4Ljk4NyAxNy40MTc5IDU4Ljk4NyAxOS43MDVDNTguOTg3IDIxLjk5MiA1OC4wNzg1IDI0LjE4NTQgNTYuNDYxMyAyNS44MDI2QzU0Ljg0NDEgMjcuNDE5OCA1Mi42NTA3IDI4LjMyODQgNTAuMzYzNiAyOC4zMjg0WiIgZmlsbD0idmFyKC0tZmlsbC0wLCAjQTVGM0ZDKSIgc3Ryb2tlPSJ2YXIoLS1zdHJva2UtMSwgIzE4MjI0RSkiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+CjxwYXRoIGlkPSJWZWN0b3JfMiIgZD0iTTEwLjEyNDIgODguMjM0NkgyNi40MTQzQzI4LjkwMjEgODguMjM0IDMxLjM0MDggODcuNTQxNiAzMy40NTc4IDg2LjIzNDlDMzUuNTc0OCA4NC45MjgxIDM3LjI4NjYgODMuMDU4NSAzOC40MDIxIDgwLjgzNUMzOS41MTc2IDc4LjYxMTQgMzkuOTkyOCA3Ni4xMjE1IDM5Ljc3NDUgNzMuNjQzNUMzOS41NTYyIDcxLjE2NTQgMzguNjUzMSA2OC43OTY5IDM3LjE2NiA2Ni44MDI1QzM1LjY3OSA2NC44MDgyIDMzLjY2NjYgNjMuMjY2NiAzMS4zNTM4IDYyLjM1QzI5LjA0MSA2MS40MzM0IDI2LjUxODggNjEuMTc4IDI0LjA2OTIgNjEuNjEyMkMyMS42MTk1IDYyLjA0NjQgMTkuMzM4OSA2My4xNTMyIDE3LjQ4MjEgNjQuODA4OUMxNS42MjUzIDY2LjQ2NDUgMTQuMjY1NSA2OC42MDM5IDEzLjU1NDcgNzAuOTg3OEgxMC4xMjQyQzcuODM2OSA3MC45ODc4IDUuNjQzMzEgNzEuODk2MyA0LjAyNTk2IDczLjUxMzVDMi40MDg2MiA3NS4xMzA3IDEuNSA3Ny4zMjQxIDEuNSA3OS42MTEyQzEuNSA4MS44OTgzIDIuNDA4NjIgODQuMDkxNyA0LjAyNTk2IDg1LjcwODlDNS42NDMzMSA4Ny4zMjYxIDcuODM2OSA4OC4yMzQ2IDEwLjEyNDIgODguMjM0NloiIGZpbGw9InZhcigtLWZpbGwtMCwgd2hpdGUpIiBzdHJva2U9InZhcigtLXN0cm9rZS0wLCAjMTgyMjRFKSIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9nPgo8L3N2Zz4K"
                />
            </div>
        </div>
        <div className="absolute inset-[46.97%_10.52%_17.03%_67.48%]">
            <div className="absolute inset-[-4.17%_-6.82%]">
                <img
                    alt=""
                    className="block max-w-none size-full"
                    src="data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgdmlld0JveD0iMCAwIDI1IDM5IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBpZD0iVmVjdG9yIiBkPSJNOC45NDkzMiAyMi4wNzE0TDEuNSAyOS43ODU3TDguOTQ5MzIgMzcuNU0xLjUgMjkuNzg1N0w4LjU3Njg2IDI5LjRDMTEuNjIxNCAyOS4yMjQzIDE0LjU1MTkgMjguMTQwMSAxNy4wMTQ4IDI2LjI3ODNDMTkuNDc3NyAyNC40MTY0IDIxLjM2NzggMjEuODU2NCAyMi40NTcyIDE4LjkwNzFDMjMuNTQ2NSAxNS45NTc3IDIzLjc4ODYgMTIuNzQ0OSAyMy4xNTQyIDkuNjU2MjFDMjIuNTE5OCA2LjU2NzU0IDIxLjAzNiAzLjczNDkyIDE4Ljg4MTggMS41IiBzdHJva2U9InZhcigtLXN0cm9rZS0wLCAjMTgyMjRFKSIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+Cg=="
                />
            </div>
        </div>
        <div className="absolute inset-[22.97%_66.52%_41.03%_9.48%]">
            <div className="absolute inset-[-4.17%_-6.25%]">
                <img
                    alt=""
                    className="block max-w-none size-full"
                    src="data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgdmlld0JveD0iMCAwIDI3IDM5IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBpZD0iVmVjdG9yIiBkPSJNMTcuMzczNiAxNi45Mjg4TDI1LjUgOS4yMTQzOUwxNy4zNzM2IDEuNU0yNS41IDkuMjE0MzlMMTcuNzc5NCA5LjU5OTYyQzE0LjQ1ODEgOS43NzUzMyAxMS4yNjEzIDEwLjg1OTUgOC41NzQ2IDEyLjcyMTRDNS44ODc4NiAxNC41ODMyIDMuODI1OTYgMTcuMTQzMyAyLjYzNzU5IDIwLjA5MjdDMS40NDkyMiAyMy4wNDIxIDEuMTg1MTUgMjYuMjU1IDEuODc3MjMgMjkuMzQzN0MyLjU2OTMxIDMyLjQzMjQgNC4xODc5NyAzNS4yNjUxIDYuNTM3OTggMzcuNSIgc3Ryb2tlPSJ2YXIoLS1zdHJva2UtMCwgIzE4MjI0RSkiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo="
                />
            </div>
        </div>
    </div>
);

export default DataSharingTileIcon;
