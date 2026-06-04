/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_LoadingInputs */

const en_alerts_loading = /** @type {(inputs: Alerts_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Loading...`)
};

const es_alerts_loading = /** @type {(inputs: Alerts_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cargando...`)
};

const de_alerts_loading = /** @type {(inputs: Alerts_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Laden...`)
};

const ar_alerts_loading = /** @type {(inputs: Alerts_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`جاري التحميل...`)
};

const fr_alerts_loading = /** @type {(inputs: Alerts_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement...`)
};

const ko_alerts_loading = /** @type {(inputs: Alerts_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`로딩...`)
};

/**
* | output |
* | --- |
* | "Loading..." |
*
* @param {Alerts_LoadingInputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_loading = /** @type {((inputs?: Alerts_LoadingInputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_LoadingInputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_loading(inputs)
	if (locale === "es") return es_alerts_loading(inputs)
	if (locale === "de") return de_alerts_loading(inputs)
	if (locale === "ar") return ar_alerts_loading(inputs)
	if (locale === "fr") return fr_alerts_loading(inputs)
	return ko_alerts_loading(inputs)
});
export { alerts_loading as "alerts.loading" }