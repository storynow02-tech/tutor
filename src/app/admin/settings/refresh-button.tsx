'use client';

import { useTransition } from 'react';
import { Button } from "@/components/ui/button";
import { refreshNotionData } from "@/app/admin/actions";

export default function RefreshButton() {
    const [isPending, startTransition] = useTransition();

    const handleRefresh = () => {
        startTransition(async () => {
            await refreshNotionData();
            alert("知識庫更新完成！"); // Simple feedback for now
        });
    };

    return (
        <Button
            onClick={handleRefresh}
            disabled={isPending}
            variant="outline"
        >
            {isPending ? "更新中..." : "立即更新"}
        </Button>
    );
}
