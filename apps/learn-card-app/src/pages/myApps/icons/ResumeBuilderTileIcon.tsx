import React from 'react';

/**
 * Resume Builder tile icon — exported from Figma (LC-1928, node 2344:79811).
 * Self-contained: layer SVGs are inlined as base64 data URIs (no localhost/asset-server dep).
 * Designed to fill a square parent (root is `size-full`).
 */
const ResumeBuilderTileIcon: React.FC<{ className?: string }> = ({ className }) => (
    <div className={`relative size-full ${className ?? ''}`} aria-hidden="true">
        <div className="absolute inset-[23.27%_2.05%_1.95%_38.16%]">
            <img
                alt=""
                className="absolute block inset-0 max-w-none size-full"
                src="data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgdmlld0JveD0iMCAwIDU5Ljc5MTcgNzQuNzg2MyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggaWQ9IlZlY3RvciIgZD0iTTMzLjYzMjggMEg3LjQ3Mzk2QzUuNDkxNzQgMCAzLjU5MDcxIDAuNzg3OTI1IDIuMTg5MDcgMi4xOTA0NEMwLjc4NzQzMiAzLjU5Mjk2IDAgNS40OTUxOCAwIDcuNDc4NjNWNjcuMzA3N0MwIDY5LjI5MTEgMC43ODc0MzIgNzEuMTkzNCAyLjE4OTA3IDcyLjU5NTlDMy41OTA3MSA3My45OTg0IDUuNDkxNzQgNzQuNzg2MyA3LjQ3Mzk2IDc0Ljc4NjNINTIuMzE3N0M1NC4yOTk5IDc0Ljc4NjMgNTYuMjAwOSA3My45OTg0IDU3LjYwMjYgNzIuNTk1OUM1OS4wMDQyIDcxLjE5MzQgNTkuNzkxNyA2OS4yOTExIDU5Ljc5MTcgNjcuMzA3N1YyNi4xNzUyTDMzLjYzMjggMFoiIGZpbGw9InZhcigtLWZpbGwtMCwgI0I5MUMxQykiLz4KPC9zdmc+Cg=="
            />
        </div>
        <div className="absolute inset-[7.8%_12.3%_12.42%_27.91%]">
            <img
                alt=""
                className="absolute block inset-0 max-w-none size-full"
                src="data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgdmlld0JveD0iMCAwIDU5Ljc5MTcgNzkuNzg2MyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggaWQ9IlZlY3RvciIgZD0iTTMzLjYzMjggMEg3LjQ3Mzk2QzUuNDkxNzQgMCAzLjU5MDcxIDAuNzg3OTI1IDIuMTg5MDcgMi4xOTA0NEMwLjc4NzQzMiAzLjU5Mjk2IDAgNS40OTUxNyAwIDcuNDc4NjNWNzIuMzA3N0MwIDc0LjI5MTEgMC43ODc0MzIgNzYuMTkzNCAyLjE4OTA3IDc3LjU5NTlDMy41OTA3MSA3OC45OTg0IDUuNDkxNzQgNzkuNzg2MyA3LjQ3Mzk2IDc5Ljc4NjNINTIuMzE3N0M1NC4yOTk5IDc5Ljc4NjMgNTYuMjAwOSA3OC45OTg0IDU3LjYwMjYgNzcuNTk1OUM1OS4wMDQyIDc2LjE5MzQgNTkuNzkxNyA3NC4yOTExIDU5Ljc5MTcgNzIuMzA3N1YyNi4xNzUyTDMzLjYzMjggMFoiIGZpbGw9InZhcigtLWZpbGwtMCwgd2hpdGUpIi8+Cjwvc3ZnPgo="
            />
        </div>
        <div className="absolute bottom-[22.5%] left-1/2 right-[35%] top-[62.5%]">
            <img
                alt=""
                className="absolute block inset-0 max-w-none size-full"
                src="data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgdmlld0JveD0iMCAwIDE1IDE1IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBpZD0iVmVjdG9yIDYyNjlfMyIgZD0iTTUuODYxNSAzLjI1MDYzTDcuMDg1NzYgMC4yNzc0MDRDNy4xNTQ4OCAwLjEwOTU1IDcuMzE4NTYgMCA3LjUgMEM3LjY4MTQ0IDAgNy44NDUxMiAwLjEwOTU1IDcuOTE0MjQgMC4yNzc0MDRMOS4xMzg0OCAzLjI1MDYzQzkuNjI1OTIgNC40MzQyNCAxMC41NjU4IDUuMzc0MTMgMTEuNzQ5NCA1Ljg2MTVMMTQuNzIyNiA3LjA4NTc4QzE0Ljg5MDYgNy4xNTQ4OCAxNSA3LjMxODQ2IDE1IDcuNUMxNSA3LjY4MTU0IDE0Ljg5MDYgNy44NDUxMiAxNC43MjI2IDcuOTE0MjJMMTEuNzQ5NCA5LjEzODVDMTAuNTY1OCA5LjYyNTg3IDkuNjI1OTIgMTAuNTY1OCA5LjEzODQ4IDExLjc0OTRMNy45MTQyNCAxNC43MjI2QzcuODQ1MTIgMTQuODkwNCA3LjY4MTQ0IDE1IDcuNSAxNUM3LjMxODU2IDE1IDcuMTU0ODggMTQuODkwNCA3LjA4NTc2IDE0LjcyMjZMNS44NjE1IDExLjc0OTRDNS4zNzQxMyAxMC41NjU4IDQuNDM0MjQgOS42MjU4NyAzLjI1MDYzIDkuMTM4NUwwLjI3NzM5MiA3LjkxNDIyQzAuMTA5NTYgNy44NDUxMiAwIDcuNjgxNTQgMCA3LjVDMCA3LjMxODQ2IDAuMTA5NTYgNy4xNTQ4OCAwLjI3NzM5MiA3LjA4NTc4TDMuMjUwNjMgNS44NjE1QzQuNDM0MjQgNS4zNzQxMyA1LjM3NDEzIDQuNDM0MjQgNS44NjE1IDMuMjUwNjNaIiBmaWxsPSJ2YXIoLS1maWxsLTAsICMzOEJERjgpIi8+Cjwvc3ZnPgo="
            />
        </div>
        <div className="absolute inset-[45%_20%_35%_60%]">
            <img
                alt=""
                className="absolute block inset-0 max-w-none size-full"
                src="data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgdmlld0JveD0iMCAwIDIwIDIwIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8cGF0aCBpZD0iVmVjdG9yIDYyNjlfMyIgZD0iTTcuODE1MzMgNC4zMzQxOEw5LjQ0NzY4IDAuMzY5ODcyQzkuNTM5ODQgMC4xNDYwNjcgOS43NTgwOCAwIDEwIDBDMTAuMjQxOSAwIDEwLjQ2MDIgMC4xNDYwNjcgMTAuNTUyMyAwLjM2OTg3MkwxMi4xODQ2IDQuMzM0MThDMTIuODM0NiA1LjkxMjMyIDE0LjA4NzcgNy4xNjU1IDE1LjY2NTkgNy44MTUzM0wxOS42MzAxIDkuNDQ3NzFDMTkuODU0MSA5LjUzOTg0IDIwIDkuNzU3OTUgMjAgMTBDMjAgMTAuMjQyIDE5Ljg1NDEgMTAuNDYwMiAxOS42MzAxIDEwLjU1MjNMMTUuNjY1OSAxMi4xODQ3QzE0LjA4NzcgMTIuODM0NSAxMi44MzQ2IDE0LjA4NzcgMTIuMTg0NiAxNS42NjU4TDEwLjU1MjMgMTkuNjMwMUMxMC40NjAyIDE5Ljg1MzkgMTAuMjQxOSAyMCAxMCAyMEM5Ljc1ODA4IDIwIDkuNTM5ODQgMTkuODUzOSA5LjQ0NzY4IDE5LjYzMDFMNy44MTUzMyAxNS42NjU4QzcuMTY1NSAxNC4wODc3IDUuOTEyMzIgMTIuODM0NSA0LjMzNDE4IDEyLjE4NDdMMC4zNjk4NTYgMTAuNTUyM0MwLjE0NjA4IDEwLjQ2MDIgMCAxMC4yNDIgMCAxMEMwIDkuNzU3OTUgMC4xNDYwOCA5LjUzOTg0IDAuMzY5ODU2IDkuNDQ3NzFMNC4zMzQxOCA3LjgxNTMzQzUuOTEyMzIgNy4xNjU1IDcuMTY1NSA1LjkxMjMyIDcuODE1MzMgNC4zMzQxOFoiIGZpbGw9InZhcigtLWZpbGwtMCwgIzM4QkRGOCkiLz4KPC9zdmc+Cg=="
            />
        </div>
        <div className="absolute inset-[5.3%_11.25%_65%_61.54%]">
            <img
                alt=""
                className="absolute block inset-0 max-w-none size-full"
                src="data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgdmlld0JveD0iMCAwIDI3LjIxMDcgMjkuNzAzMyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggaWQ9IlZlY3RvciIgZD0iTTAgMFYyNS43MDMzQzAgMjcuOTEyNCAxLjc5MDg2IDI5LjcwMzMgNCAyOS43MDMzSDI3LjIxMDciIGZpbGw9InZhcigtLWZpbGwtMCwgI0UwRjJGRSkiLz4KPC9zdmc+Cg=="
            />
        </div>
        <div className="absolute inset-[7.8%_12.3%_63.53%_61.54%]">
            <div className="absolute inset-[-4.36%_-4.78%]">
                <img
                    alt=""
                    className="block max-w-none size-full"
                    src="data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgdmlld0JveD0iMCAwIDI4LjY1ODggMzEuMTc1MiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggaWQ9IlZlY3RvciIgZD0iTTEuMjUgMS4yNVYyOS45MjUySDI3LjQwODgiIHN0cm9rZT0idmFyKC0tc3Ryb2tlLTAsICMxODIyNEUpIiBzdHJva2Utd2lkdGg9IjIuNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo="
                />
            </div>
        </div>
        <div className="absolute inset-[7.8%_11.87%_12.42%_28.33%]">
            <div className="absolute inset-[-1.57%_-2.09%]">
                <img
                    alt=""
                    className="block max-w-none size-full"
                    src="data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgdmlld0JveD0iMCAwIDYyLjI5MTcgODIuMjg2MyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggaWQ9IlZlY3RvciIgZD0iTTEuMjUgOS43MDMyOVY4LjcyODYzQzEuMjUgNi43NDUxNyAyLjAzNzQzIDQuODQyOTYgMy40MzkwNyAzLjQ0MDQ0QzQuODQwNzEgMi4wMzc5MiA2Ljc0MTc0IDEuMjUgOC43MjM5NiAxLjI1SDM0Ljg4MjhMNjEuMDQxNyAyNy40MjUyVjczLjU1NzdDNjEuMDQxNyA3NS41NDExIDYwLjI1NDIgNzcuNDQzNCA1OC44NTI2IDc4Ljg0NTlDNTcuNDUwOSA4MC4yNDg0IDU1LjU0OTkgODEuMDM2MyA1My41Njc3IDgxLjAzNjNIOC43MjM5NkM2Ljc0MTc0IDgxLjAzNjMgNC44NDA3MSA4MC4yNDg0IDMuNDM5MDcgNzguODQ1OUMyLjAzNzQzIDc3LjQ0MzQgMS4yNSA3NS41NDExIDEuMjUgNzMuNTU3N1Y2OS43MDMzIiBzdHJva2U9InZhcigtLXN0cm9rZS0wLCAjMTgyMjRFKSIgc3Ryb2tlLXdpZHRoPSIyLjUiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K"
                />
            </div>
        </div>
        <div className="absolute bg-white border-[#18224e] border-[2.5px] border-solid inset-[27.5%_52.5%_35%_10%] overflow-clip rounded-[300px]">
            <div className="absolute inset-[13.33%_20%_11.63%_20%]">
                <img
                    alt=""
                    className="absolute block inset-0 max-w-none size-full"
                    src="data:image/svg+xml;base64,PHN2ZyBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBvdmVyZmxvdz0idmlzaWJsZSIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyIgdmlld0JveD0iMCAwIDIyLjUgMjguMTM3NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGcgaWQ9IlByb2ZpbGUiPgo8cGF0aCBpZD0iRmlsbCAxIiBkPSJNMTEuMjUgMTguNTM1OEM1LjE4MjU3IDE4LjUzNTggMCAxOS40OTI0IDAgMjMuMzE5QzAgMjcuMTQ3IDUuMTUwMjEgMjguMTM3NCAxMS4yNSAyOC4xMzc0QzE3LjMxNzQgMjguMTM3NCAyMi41IDI3LjE4MjIgMjIuNSAyMy4zNTQyQzIyLjUgMTkuNTI2MiAxNy4zNTEyIDE4LjUzNTggMTEuMjUgMTguNTM1OCIgZmlsbD0idmFyKC0tZmlsbC0wLCAjMzhCREY4KSIvPgo8cGF0aCBpZD0iRmlsbCA0IiBvcGFjaXR5PSIwLjQiIGQ9Ik0xMS4yNDg3IDE0Ljg4OTlDMTUuMzgxOCAxNC44ODk5IDE4LjY5MzMgMTEuNTc2OCAxOC42OTMzIDcuNDQ0OTNDMTguNjkzMyAzLjMxMzA4IDE1LjM4MTggMCAxMS4yNDg3IDBDNy4xMTY5OCAwIDMuODA0MDIgMy4zMTMwOCAzLjgwNDAyIDcuNDQ0OTNDMy44MDQwMiAxMS41NzY4IDcuMTE2OTggMTQuODg5OSAxMS4yNDg3IDE0Ljg4OTkiIGZpbGw9InZhcigtLWZpbGwtMCwgIzM4QkRGOCkiLz4KPC9nPgo8L3N2Zz4K"
                />
            </div>
        </div>
    </div>
);

export default ResumeBuilderTileIcon;
