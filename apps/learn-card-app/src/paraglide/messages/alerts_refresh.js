/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_RefreshInputs */

const en_alerts_refresh = /** @type {(inputs: Alerts_RefreshInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Refresh`)
};

const es_alerts_refresh = /** @type {(inputs: Alerts_RefreshInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualizar`)
};

const fr_alerts_refresh = /** @type {(inputs: Alerts_RefreshInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualiser`)
};

const ar_alerts_refresh = /** @type {(inputs: Alerts_RefreshInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تحديث`)
};

/**
* | output |
* | --- |
* | "Refresh" |
*
* @param {Alerts_RefreshInputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_refresh = /** @type {((inputs?: Alerts_RefreshInputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_RefreshInputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_refresh(inputs)
	if (locale === "es") return es_alerts_refresh(inputs)
	if (locale === "fr") return fr_alerts_refresh(inputs)
	return ar_alerts_refresh(inputs)
});
export { alerts_refresh as "alerts.refresh" }