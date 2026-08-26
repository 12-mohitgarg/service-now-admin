import React, { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import {
    collection,
    getDocs,
    query,
    orderBy
} from "firebase/firestore";

interface Notification {
    id: string;
    title: string;
    message: string;
    createdAt?: string;
    isActive?: boolean;
}

export default function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const notificationsQuery = query(
                collection(db, "notifications"),
                orderBy("createdAt", "desc")
            );

            const notificationsSnapshot = await getDocs(notificationsQuery);

            const notificationsData = notificationsSnapshot.docs
                .map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                } as Notification))
                .filter((notification) => notification.isActive !== false);

            setNotifications(notificationsData);
        } catch (error) {
            console.log(error);
        }
    };

    return (
        <div className="max-w-5xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">
                Notifications
            </h1>

            <div className="space-y-4">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className="border-l-4 border-blue-500 bg-white p-4 rounded"
                    >
                        <h3 className="font-bold">
                            {notification.title}
                        </h3>

                        <p className="mt-2">
                            {notification.message}
                        </p>

                        {notification.createdAt && (
                            <p className="text-sm text-gray-500 mt-2">
                                {new Date(
                                    notification.createdAt
                                ).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}