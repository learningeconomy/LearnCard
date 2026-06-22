/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Dashboard_Datatrust_Emptydetail2Inputs */

const en_dashboard_datatrust_emptydetail2 = /** @type {(inputs: Dashboard_Datatrust_Emptydetail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`When an app or school asks for your data, you decide — every time.`)
};

const es_dashboard_datatrust_emptydetail2 = /** @type {(inputs: Dashboard_Datatrust_Emptydetail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Cuando una app o una institución pida tus datos, tú decides, cada vez.`)
};

const fr_dashboard_datatrust_emptydetail2 = /** @type {(inputs: Dashboard_Datatrust_Emptydetail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Lorsqu'une app ou une école demande vos données, c'est vous qui décidez, à chaque fois.`)
};

const ar_dashboard_datatrust_emptydetail2 = /** @type {(inputs: Dashboard_Datatrust_Emptydetail2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`عندما يطلب تطبيق أو مؤسسة تعليمية بياناتك، أنت من يقرر، في كل مرة.`)
};

/**
* | output |
* | --- |
* | "When an app or school asks for your data, you decide — every time." |
*
* @param {Dashboard_Datatrust_Emptydetail2Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const dashboard_datatrust_emptydetail2 = /** @type {((inputs?: Dashboard_Datatrust_Emptydetail2Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Dashboard_Datatrust_Emptydetail2Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_dashboard_datatrust_emptydetail2(inputs)
	if (locale === "es") return es_dashboard_datatrust_emptydetail2(inputs)
	if (locale === "fr") return fr_dashboard_datatrust_emptydetail2(inputs)
	return ar_dashboard_datatrust_emptydetail2(inputs)
});
export { dashboard_datatrust_emptydetail2 as "dashboard.dataTrust.emptyDetail" }