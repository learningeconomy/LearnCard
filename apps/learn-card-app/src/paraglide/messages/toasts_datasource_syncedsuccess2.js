/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Toasts_Datasource_Syncedsuccess2Inputs */

const en_toasts_datasource_syncedsuccess2 = /** @type {(inputs: Toasts_Datasource_Syncedsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Successfully synced Data Source!`)
};

const es_toasts_datasource_syncedsuccess2 = /** @type {(inputs: Toasts_Datasource_Syncedsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`¡Fuente de datos sincronizada exitosamente!`)
};

const de_toasts_datasource_syncedsuccess2 = /** @type {(inputs: Toasts_Datasource_Syncedsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Datenquelle erfolgreich synchronisiert!`)
};

const ar_toasts_datasource_syncedsuccess2 = /** @type {(inputs: Toasts_Datasource_Syncedsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`تم مزامنة مصدر البيانات بنجاح!`)
};

const fr_toasts_datasource_syncedsuccess2 = /** @type {(inputs: Toasts_Datasource_Syncedsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Source de données synchronisée avec succès !`)
};

const ko_toasts_datasource_syncedsuccess2 = /** @type {(inputs: Toasts_Datasource_Syncedsuccess2Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`데이터 소스가 성공적으로 동기화되었습니다!`)
};

/**
* | output |
* | --- |
* | "Successfully synced Data Source!" |
*
* @param {Toasts_Datasource_Syncedsuccess2Inputs} inputs
* @param {{ locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }} options
* @returns {LocalizedString}
*/
const toasts_datasource_syncedsuccess2 = /** @type {((inputs?: Toasts_Datasource_Syncedsuccess2Inputs, options?: { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Toasts_Datasource_Syncedsuccess2Inputs, { locale?: "en" | "es" | "de" | "ar" | "fr" | "ko" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_toasts_datasource_syncedsuccess2(inputs)
	if (locale === "es") return es_toasts_datasource_syncedsuccess2(inputs)
	if (locale === "de") return de_toasts_datasource_syncedsuccess2(inputs)
	if (locale === "ar") return ar_toasts_datasource_syncedsuccess2(inputs)
	if (locale === "fr") return fr_toasts_datasource_syncedsuccess2(inputs)
	return ko_toasts_datasource_syncedsuccess2(inputs)
});
export { toasts_datasource_syncedsuccess2 as "toasts.dataSource.syncedSuccess" }