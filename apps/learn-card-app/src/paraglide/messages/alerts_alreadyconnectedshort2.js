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

const de_alerts_alreadyconnectedshort2 = /** @type {(inputs: Alerts_Alreadyconnectedshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Profile sind bereits verbunden`)
};

const ar_alerts_alreadyconnectedshort2 = /** @type {(inputs: Alerts_Alreadyconnectedshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الملفات الشخصية متصلة بالفعل`)
};

const fr_alerts_alreadyconnectedshort2 = /** @type {(inputs: Alerts_Alreadyconnectedshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les profils sont déjà connectés`)
};

const ko_alerts_alreadyconnectedshort2 = /** @type {(inputs: Alerts_Alreadyconnectedshort2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`프로필이 이미 연결됨`)
};

/**
* | output |
* | --- |
* | "Profiles are already connected" |
*
* @param {Alerts_Alreadyconnectedshort2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const alerts_alreadyconnectedshort2 = /** @type {((inputs?: Alerts_Alreadyconnectedshort2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Alerts_Alreadyconnectedshort2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_alerts_alreadyconnectedshort2(inputs)
	if (locale === "es") return es_alerts_alreadyconnectedshort2(inputs)
	if (locale === "de") return de_alerts_alreadyconnectedshort2(inputs)
	if (locale === "ar") return ar_alerts_alreadyconnectedshort2(inputs)
	if (locale === "fr") return fr_alerts_alreadyconnectedshort2(inputs)
	return ko_alerts_alreadyconnectedshort2(inputs)
});
export { alerts_alreadyconnectedshort2 as "alerts.alreadyConnectedShort" }