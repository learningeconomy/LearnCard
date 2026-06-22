/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Alerts_Alreadyconnectedshort2Inputs */

const en_alerts_alreadyconnectedshort2 = /** @type {(inputs: Alerts_Alreadyconnectedshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profiles are already connected`)
};

const es_alerts_alreadyconnectedshort2 = /** @type {(inputs: Alerts_Alreadyconnectedshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Los perfiles ya están conectados`)
};

const fr_alerts_alreadyconnectedshort2 = /** @type {(inputs: Alerts_Alreadyconnectedshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les profils sont déjà connectés`)
};

const ar_alerts_alreadyconnectedshort2 = /** @type {(inputs: Alerts_Alreadyconnectedshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الملفات الشخصية متصلة بالفعل`)
};

/**
* | output |
* | --- |
* | "Profiles are already connected" |
*
* @param {Alerts_Alreadyconnectedshort2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const alerts_alreadyconnectedshort2 = /** @type {((inputs?: Alerts_Alreadyconnectedshort2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Alreadyconnectedshort2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_alreadyconnectedshort2(inputs)
	if (locale === "es") return es_alerts_alreadyconnectedshort2(inputs)
	if (locale === "fr") return fr_alerts_alreadyconnectedshort2(inputs)
	return ar_alerts_alreadyconnectedshort2(inputs)
});
export { alerts_alreadyconnectedshort2 as "alerts.alreadyConnectedShort" }