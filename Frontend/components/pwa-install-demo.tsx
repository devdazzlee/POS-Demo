'use client';

import { PWAInstallPrompt } from '@/components/pwa-install-prompt';
import { PWABanner } from '@/components/pwa-banner';
import { PWAInstallButton } from '@/components/pwa-install-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

export function PWAInstallDemo() {
  const [showModal, setShowModal] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showFloating, setShowFloating] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">PWA Installation Demo</h1>
        <p className="text-muted-foreground">
          Test different installation prompt styles
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Modal Prompt */}
        <Card>
          <CardHeader>
            <CardTitle>Modal Prompt</CardTitle>
            <CardDescription>
              Full-screen modal with detailed information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowModal(true)} className="w-full">
              Show Modal Prompt
            </Button>
          </CardContent>
        </Card>

        {/* Banner Prompt */}
        <Card>
          <CardHeader>
            <CardTitle>Bottom Banner</CardTitle>
            <CardDescription>
              Non-intrusive banner at the bottom
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowBanner(true)} className="w-full">
              Show Banner
            </Button>
          </CardContent>
        </Card>

        {/* Floating Button */}
        <Card>
          <CardHeader>
            <CardTitle>Floating Button</CardTitle>
            <CardDescription>
              Small floating action button
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowFloating(true)} className="w-full">
              Show Floating Button
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Inline Install Button */}
      <Card>
        <CardHeader>
          <CardTitle>Inline Install Button</CardTitle>
          <CardDescription>
            Install button that can be placed anywhere in your UI
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <PWAInstallButton variant="inline" />
          </div>
        </CardContent>
      </Card>

      {/* Render Components */}
      {showModal && <PWAInstallPrompt />}
      {showBanner && <PWABanner />}
      {showFloating && <PWAInstallButton variant="floating" />}
    </div>
  );
}
