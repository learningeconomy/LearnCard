/* eslint-disable */
import { getLocale, experimentalStaticLocale } from '../runtime.js';

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */

/** @typedef {{}} Wallet_Categorydescriptor_Descriptions_Experiences1Inputs */

const en_wallet_categorydescriptor_descriptions_experiences1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Experiences1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Experiences are the knowledge and skills gained from involvement in various professional roles and activities over time. They encompass the breadth of work-related tasks, projects, and responsibilities an individual has undertaken within different organizations or as a freelancer. Professional experiences contribute significantly to an individual's expertise, capabilities, and understanding of industry standards and practices.`)
};

const es_wallet_categorydescriptor_descriptions_experiences1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Experiences1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Las experiencias son los conocimientos y las habilidades adquiridos al participar en diversos roles y actividades profesionales a lo largo del tiempo. Abarcan la amplitud de tareas, proyectos y responsabilidades laborales que una persona ha asumido en distintas organizaciones o como trabajador independiente. Las experiencias profesionales contribuyen significativamente a la pericia, las capacidades y la comprensión de los estándares y las prácticas del sector.`)
};

const fr_wallet_categorydescriptor_descriptions_experiences1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Experiences1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Les expériences sont les connaissances et les compétences acquises en participant à divers rôles et activités professionnels au fil du temps. Elles englobent l'ensemble des tâches, des projets et des responsabilités liés au travail qu'une personne a assumés au sein de différentes organisations ou en tant qu'indépendant. Les expériences professionnelles contribuent de manière significative à l'expertise, aux capacités et à la compréhension des normes et des pratiques du secteur.`)
};

const ar_wallet_categorydescriptor_descriptions_experiences1 = /** @type {(inputs: Wallet_Categorydescriptor_Descriptions_Experiences1Inputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`الخبرات هي المعارف والمهارات المكتسبة من المشاركة في أدوار وأنشطة مهنية متنوعة عبر الزمن. وهي تشمل مجموعة واسعة من المهام والمشاريع والمسؤوليات المتعلقة بالعمل التي اضطلع بها الفرد ضمن مؤسسات مختلفة أو كعامل مستقل. وتسهم الخبرات المهنية إسهاماً كبيراً في خبرة الفرد وقدراته وفهمه لمعايير القطاع وممارساته.`)
};

/**
* | output |
* | --- |
* | "Experiences are the knowledge and skills gained from involvement in various professional roles and activities over time. They encompass the breadth of work-r..." |
*
* @param {Wallet_Categorydescriptor_Descriptions_Experiences1Inputs} inputs
* @param {{ locale?: "en" | "es" | "fr" | "ar" }} options
* @returns {LocalizedString}
*/
const wallet_categorydescriptor_descriptions_experiences1 = /** @type {((inputs?: Wallet_Categorydescriptor_Descriptions_Experiences1Inputs, options?: { locale?: "en" | "es" | "fr" | "ar" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Wallet_Categorydescriptor_Descriptions_Experiences1Inputs, { locale?: "en" | "es" | "fr" | "ar" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return en_wallet_categorydescriptor_descriptions_experiences1(inputs)
	if (locale === "es") return es_wallet_categorydescriptor_descriptions_experiences1(inputs)
	if (locale === "fr") return fr_wallet_categorydescriptor_descriptions_experiences1(inputs)
	return ar_wallet_categorydescriptor_descriptions_experiences1(inputs)
});
export { wallet_categorydescriptor_descriptions_experiences1 as "wallet.categoryDescriptor.descriptions.experiences" }