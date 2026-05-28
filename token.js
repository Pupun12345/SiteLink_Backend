async function getToken() {
    const token = await getToken(messaging, { vapidKey: "BJXR-a2GtzkeQiUhiwGe79R4fDvvUDRgDb00FRcMf36_ujM2WsFrSVQ43C5WB2mOw0a9n6LJxVE0LEV1gZHMPUQ" });
    console.log("FCM Token:", token);
}

getToken().catch(console.error);