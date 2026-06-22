/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Versioninfo_Updatechannel2Inputs */

const en_versioninfo_updatechannel2 = /** @type {(inputs: Versioninfo_Updatechannel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Update channel`)
};

const es_versioninfo_updatechannel2 = /** @type {(inputs: Versioninfo_Updatechannel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Canal de actualización`)
};

const fr_versioninfo_updatechannel2 = /** @type {(inputs: Versioninfo_Updatechannel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Canal de mise à jour`)
};

const ar_versioninfo_updatechannel2 = /** @type {(inputs: Versioninfo_Updatechannel2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`قناة التحديث`)
};

/**
* | output |
* | --- |
* | "Update channel" |
*
* @param {Versioninfo_Updatechannel2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const versioninfo_updatechannel2 = /** @type {((inputs?: Versioninfo_Updatechannel2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Versioninfo_Updatechannel2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_versioninfo_updatechannel2(inputs)
	if (locale === "es") return es_versioninfo_updatechannel2(inputs)
	if (locale === "fr") return fr_versioninfo_updatechannel2(inputs)
	return ar_versioninfo_updatechannel2(inputs)
});
export { versioninfo_updatechannel2 as "versionInfo.updateChannel" }