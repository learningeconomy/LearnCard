module.exports = {
    neo4j: {
        image: 'neo4j',
        tag: 'latest',
        ports: [7474, 7687],
        env: {
            NEO4J_AUTH: 'none',
        },
    },
};
