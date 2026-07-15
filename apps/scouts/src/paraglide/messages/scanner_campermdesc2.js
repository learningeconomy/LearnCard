/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Scanner_Campermdesc2Inputs */

const en_scanner_campermdesc2 = /** @type {(inputs: Scanner_Campermdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`New connection requests, New boosts (like achievements, credentials, and badges) via QR codes.`)
};

const es_scanner_campermdesc2 = /** @type {(inputs: Scanner_Campermdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nuevas solicitudes de conexión, nuevos Boosts (como logros, credenciales e insignias) mediante códigos QR.`)
};

const fr_scanner_campermdesc2 = /** @type {(inputs: Scanner_Campermdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Nouvelles demandes de connexion, nouveaux Boosts (comme les réalisations, les justificatifs et les badges) via des codes QR.`)
};

const ar_scanner_campermdesc2 = /** @type {(inputs: Scanner_Campermdesc2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`طلبات اتصال جديدة، تعزيزات جديدة (مثل الإنجازات والمؤهلات والشارات) عبر رموز QR.`)
};

/**
* | output |
* | --- |
* | "New connection requests, New boosts (like achievements, credentials, and badges) via QR codes." |
*
* @param {Scanner_Campermdesc2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const scanner_campermdesc2 = /** @type {((inputs?: Scanner_Campermdesc2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Scanner_Campermdesc2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_scanner_campermdesc2(inputs)
	if (locale === "es") return es_scanner_campermdesc2(inputs)
	if (locale === "fr") return fr_scanner_campermdesc2(inputs)
	return ar_scanner_campermdesc2(inputs)
});
export { scanner_campermdesc2 as "scanner.camPermDesc" }