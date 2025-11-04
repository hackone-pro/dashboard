export default {
    routes: [
        {
            method: "GET",
            path: "/custom-dashboards/me",
            handler: "custom-dashboard.me",
            config: {
                policies: [],
            },
        },
        {
            method: "PUT",
            path: "/custom-dashboards/me",
            handler: "custom-dashboard.updateMe",
            config: {
                policies: [],
            },
        },
        {
            method: "PUT",
            path: "/custom-dashboards/reset-me",
            handler: "custom-dashboard.resetMe",
            config: {
                policies: [],
            },
        },
    ],
};  